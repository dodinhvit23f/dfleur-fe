import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Order } from "@/components/admin/orderUtils";
import { requireEnv } from "./client";
import { normalizeOrder } from "./orders";

export type OrderEventType = "ORDER_CREATED" | "ORDER_UPDATED";

export interface OrderNotificationEvent {
  eventType: OrderEventType;
  order: Order;
  actor: string;
  traceId: string;
}

const ORDER_EVENT_TYPES: readonly OrderEventType[] = [
  "ORDER_CREATED",
  "ORDER_UPDATED",
];

function isOrderEventType(value: string): value is OrderEventType {
  return (ORDER_EVENT_TYPES as readonly string[]).includes(value);
}

class FatalSseError extends Error {
  status: number;
  constructor(status: number) {
    super(`SSE fatal: ${status}`);
    this.status = status;
  }
}

export interface SubscribeOrderEventsOptions {
  getToken: () => string | null;
  onEvent: (event: OrderNotificationEvent) => void;
  /** Fires on every reconnect AFTER the first successful open — the backend
   *  keeps no history/Last-Event-ID, so anything missed while disconnected
   *  must be recovered by refetching. */
  onReconnect: () => void;
  /** 401 (expired/invalid token) or 403 (role not allowed). */
  onFatal: (status: number) => void;
}

/** Opens the one app-wide order-notification stream. Returns an unsubscribe function. */
export function subscribeOrderEvents(
  options: SubscribeOrderEventsOptions,
): () => void {
  const { getToken, onEvent, onReconnect, onFatal } = options;
  const url = requireEnv(
    "NEXT_PUBLIC_API_ORDER_SUBSCRIBE",
    process.env.NEXT_PUBLIC_API_ORDER_SUBSCRIBE,
  );
  const ctrl = new AbortController();
  let opened = false;

  fetchEventSource(url, {
    signal: ctrl.signal,
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    // Keep the one connection alive while the tab is hidden — "one connection
    // per tab/session", not per page/visibility state.
    openWhenHidden: true,
    async onopen(response) {
      if (response.status === 401 || response.status === 403) {
        throw new FatalSseError(response.status);
      }
      if (!response.ok) throw new Error(`SSE HTTP ${response.status}`);
      // Every reconnect after the first means events were possibly missed
      // (no replay support) — the caller should refetch.
      if (opened) onReconnect();
      opened = true;
    },
    onmessage(msg) {
      if (!isOrderEventType(msg.event)) return;
      try {
        const parsed = JSON.parse(msg.data) as OrderNotificationEvent;
        onEvent({ ...parsed, order: normalizeOrder(parsed.order) });
      } catch {
        // Malformed payload: drop it, don't crash the stream.
      }
    },
    onerror(err) {
      if (err instanceof FatalSseError) {
        onFatal(err.status);
        throw err; // stop the library's own retry loop
      }
      // Any other error (network blip, 5xx, the normal 5-minute server-side
      // cap): swallow and let the library's default backoff retry silently.
    },
  }).catch(() => {
    // Rejects only when onerror rethrew (fatal, already handled via onFatal)
    // or the signal aborted (intentional unsubscribe) — nothing more to do.
  });

  return () => ctrl.abort();
}
