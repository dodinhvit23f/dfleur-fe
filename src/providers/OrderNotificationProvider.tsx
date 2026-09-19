"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { refreshTokenApi } from "@/lib/api/auth";
import {
  type OrderNotificationEvent,
  subscribeOrderEvents,
} from "@/lib/api/orderSse";
import {
  ensureNotificationPermission,
  showBrowserNotification,
} from "@/lib/browserNotification";
import {
  addNotification,
  addNotifications,
  markAllRead as markAllReadStored,
  markRead as markReadStored,
  readNotifications,
  type StoredOrderNotification,
} from "@/lib/notificationStore";
import { hasAnyRole } from "@/lib/roles";
import { readStoredRoles, STORAGE_KEYS } from "@/lib/storage";
import { useNotification } from "./NotificationProvider";

const FLUSH_WINDOW_MS = 200;
const SUMMARY_THRESHOLD = 3;
const CLAIM_TTL_MS = 15_000;
const ELIGIBLE_ROLES = ["ADMIN", "SALE"];

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function eventMessage(event: OrderNotificationEvent): string {
  return event.eventType === "ORDER_CREATED"
    ? `Đơn hàng mới ${event.order.orderCode} vừa được tạo bởi ${event.actor}`
    : `Đơn hàng ${event.order.orderCode} vừa được cập nhật bởi ${event.actor}`;
}

function eventTitle(event: OrderNotificationEvent): string {
  return event.eventType === "ORDER_CREATED"
    ? "Đơn hàng mới"
    : "Đơn hàng cập nhật";
}

function toStoredNotification(
  event: OrderNotificationEvent,
): StoredOrderNotification {
  return {
    id:
      event.traceId ||
      `${event.order.orderCode}-${event.eventType}-${Date.now()}-${Math.random()}`,
    eventType: event.eventType,
    orderCode: event.order.orderCode,
    actor: event.actor,
    message: eventMessage(event),
    receivedAt: Date.now(),
    read: false,
  };
}

function summaryMessage(events: OrderNotificationEvent[]): string {
  const created = events.filter((e) => e.eventType === "ORDER_CREATED").length;
  const updated = events.length - created;
  const parts: string[] = [];
  if (created > 0) parts.push(`${created} đơn hàng mới`);
  if (updated > 0) parts.push(`${updated} đơn hàng vừa cập nhật`);
  return parts.join(", ");
}

interface OrderNotificationContextValue {
  notifications: StoredOrderNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  /** First caller for a given traceId gets `true` (proceed with its own
   *  toast/announcement); a later caller for the same traceId gets `false`
   *  (already announced elsewhere — e.g. the REST success path already ran). */
  claimTraceId: (traceId: string) => boolean;
  /** Receives a flushed batch of events (length 1 in the common case). */
  subscribe: (
    listener: (events: OrderNotificationEvent[]) => void,
  ) => () => void;
  /** Fires after every reconnect past the first — the caller should refetch. */
  subscribeReconnect: (listener: () => void) => () => void;
}

const OrderNotificationContext =
  createContext<OrderNotificationContextValue | null>(null);

export function useOrderNotifications(): OrderNotificationContextValue {
  const ctx = useContext(OrderNotificationContext);
  if (!ctx) {
    throw new Error(
      "useOrderNotifications must be used within an OrderNotificationProvider",
    );
  }
  return ctx;
}

export default function OrderNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { notify } = useNotification();
  const [notifications, setNotifications] = useState<StoredOrderNotification[]>(
    () => readNotifications(),
  );
  const [eligible, setEligible] = useState(false);
  const [connectionKey, setConnectionKey] = useState(0);

  const claimedRef = useRef<Map<string, number>>(new Map());
  const pendingEventsRef = useRef<OrderNotificationEvent[]>([]);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Set<(events: OrderNotificationEvent[]) => void>>(
    new Set(),
  );
  const reconnectListenersRef = useRef<Set<() => void>>(new Set());

  const claimTraceId = useCallback((traceId: string): boolean => {
    const now = Date.now();
    for (const [key, expiresAt] of claimedRef.current) {
      if (expiresAt <= now) claimedRef.current.delete(key);
    }
    if (claimedRef.current.has(traceId)) return false;
    claimedRef.current.set(traceId, now + CLAIM_TTL_MS);
    return true;
  }, []);

  const flush = useCallback(() => {
    flushTimeoutRef.current = null;
    const batch = pendingEventsRef.current;
    pendingEventsRef.current = [];
    if (batch.length === 0) return;

    const toSurface = batch.filter((event) => claimTraceId(event.traceId));
    if (toSurface.length > 0) {
      if (toSurface.length <= SUMMARY_THRESHOLD) {
        for (const event of toSurface) {
          notify(eventMessage(event), "info");
          showBrowserNotification(
            eventTitle(event),
            eventMessage(event),
            event.traceId,
          );
          addNotification(toStoredNotification(event));
        }
      } else {
        const summary = summaryMessage(toSurface);
        notify(summary, "info");
        showBrowserNotification("Đơn hàng", summary, `batch-${Date.now()}`);
        addNotifications(toSurface.map(toStoredNotification));
      }
      setNotifications(readNotifications());
    }

    // State sync must always happen for every event, independent of who
    // "won" the toast/announcement.
    for (const listener of listenersRef.current) listener(batch);
  }, [claimTraceId, notify]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current !== null) return;
    flushTimeoutRef.current = setTimeout(flush, FLUSH_WINDOW_MS);
  }, [flush]);

  const handleEvent = useCallback(
    (event: OrderNotificationEvent) => {
      pendingEventsRef.current.push(event);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const handleReconnect = useCallback(() => {
    for (const listener of reconnectListenersRef.current) listener();
  }, []);

  const handleFatal = useCallback((status: number) => {
    if (status !== 401) return; // 403: role genuinely lacks access, no retry
    void refreshTokenApi()
      .then(({ accessToken, refreshToken }) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        setConnectionKey((k) => k + 1);
      })
      .catch(() => {
        // Refresh failed too: leave the connection down. The next real REST
        // call's 401 handling (useApiErrorHandler) owns the logout decision.
      });
  }, []);

  // Role/token reactivity: no auth context exists to consume, so this reads
  // localStorage directly and re-evaluates on cross-tab storage changes and
  // same-tab focus (storage events don't fire in the writing tab itself).
  useEffect(() => {
    function evaluate() {
      const roles = readStoredRoles();
      const token = getStoredToken();
      const nowEligible = Boolean(token) && hasAnyRole(roles, ELIGIBLE_ROLES);
      setEligible(nowEligible);
      // No-op if already granted/denied; safe to call on every re-evaluation.
      if (nowEligible) ensureNotificationPermission();
    }
    evaluate();
    window.addEventListener("storage", evaluate);
    window.addEventListener("focus", evaluate);
    return () => {
      window.removeEventListener("storage", evaluate);
      window.removeEventListener("focus", evaluate);
    };
  }, []);

  // The one app-wide connection: opens when eligible, closes when not
  // (covers login/logout/role change), reopens on a forced `connectionKey` bump.
  // biome-ignore lint/correctness/useExhaustiveDependencies: connectionKey is a forced-reconnect trigger, not read in the body
  useEffect(() => {
    if (!eligible) return;
    return subscribeOrderEvents({
      getToken: getStoredToken,
      onEvent: handleEvent,
      onReconnect: handleReconnect,
      onFatal: handleFatal,
    });
  }, [eligible, connectionKey, handleEvent, handleReconnect, handleFatal]);

  // Clear any pending flush timer on unmount.
  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current !== null) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(markAllReadStored());
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(markReadStored(id));
  }, []);

  const subscribe = useCallback(
    (listener: (events: OrderNotificationEvent[]) => void) => {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [],
  );

  const subscribeReconnect = useCallback((listener: () => void) => {
    reconnectListenersRef.current.add(listener);
    return () => {
      reconnectListenersRef.current.delete(listener);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo<OrderNotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      claimTraceId,
      subscribe,
      subscribeReconnect,
    }),
    [
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      claimTraceId,
      subscribe,
      subscribeReconnect,
    ],
  );

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
}
