"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";
import type { OrderNotificationEvent } from "@/lib/api/orderSse";
import {
  getOrders,
  isStaleOrderError,
  type OrderListParams,
  updateOrderApi,
  updateOrderStatusApi,
} from "@/lib/api/orders";
import { useApiErrorHandler } from "@/lib/api/useApiErrorHandler";
import { useNotification } from "@/providers/NotificationProvider";
import {
  computeDeliverySortKey,
  type DeliverySortKey,
  findSortedInsertIndex,
  matchesOrderFilters,
  type Order,
  type OrderStatus,
  type OrdersFilterState,
  pickNewerOrder,
  type UpdateOrderPayload,
} from "./orderUtils";

/**
 * `claimTraceId`, when given, is called after a successful create/update so
 * the SSE echo of this same action (same `traceId`) can detect it already
 * happened here and skip its own toast/drawer entry — see
 * `OrderNotificationProvider`'s trace-ID dedup.
 */
export function useOrders(claimTraceId?: (traceId: string) => boolean) {
  const { notify } = useNotification();
  const handleError = useApiErrorHandler();

  // Source of truth: orderCode -> Order, a codes array kept sorted
  // newest-delivery-first, and each order's cached sort key (so binary-search
  // insertion never re-parses dates). `revision` invalidates the memoized
  // `orders` array derived from these refs — bumped once per mutation, or
  // once per *batch* of mutations (see `applyOrderEvents`), never mid-batch.
  const ordersRef = useRef<Map<string, Order>>(new Map());
  const codesRef = useRef<string[]>([]);
  const sortKeysRef = useRef<Map<string, DeliverySortKey>>(new Map());
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((r) => r + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: revision is a proxy for ordersRef/codesRef mutations, not read in the body
  const orders = useMemo(
    () => codesRef.current.map((code) => ordersRef.current.get(code) as Order),
    [revision],
  );

  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Codes of orders with a mutation in flight: a per-order lock, so one order
  // being written never blocks the rest of the table. The ref is the source of
  // truth for guards; the state mirrors it for the UI.
  const [pendingCodes, setPendingCodes] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const lockedRef = useRef(new Set<string>());
  const requestId = useRef(0);
  const lastParams = useRef<OrderListParams | null>(null);
  // Orders created locally since the latest list request started; that response
  // may predate them, so they are re-inserted if it doesn't contain them.
  const addedSinceFetch = useRef<Order[]>([]);
  // The orderCode currently open in the edit modal (if any), so SSE-driven
  // updates know when to also notify the open form instead of only patching
  // the background row. Owned by the caller (OrdersView), mirrored here.
  const editingCodeRef = useRef<string | null>(null);

  const setEditingCode = useCallback((code: string | null) => {
    editingCodeRef.current = code;
  }, []);

  const lockOrder = useCallback((code: string): boolean => {
    if (lockedRef.current.has(code)) return false;
    lockedRef.current.add(code);
    setPendingCodes(new Set(lockedRef.current));
    return true;
  }, []);

  const unlockOrder = useCallback((code: string) => {
    lockedRef.current.delete(code);
    setPendingCodes(new Set(lockedRef.current));
  }, []);

  // Plain O(n) indexOf, deliberately not a binary search: the sort key's ties
  // (same delivery time) make exact-identity binary removal a correctness
  // hazard, while removal is comparatively rare versus lookups (which stay
  // O(1) via the Map) — see findSortedInsertIndex's doc comment in orderUtils.ts.
  // Wrapped in useCallback (only closes over refs, so `[]` is safe and keeps
  // its identity stable) so the mutation helpers below can be listed as real
  // dependencies of the public callbacks that use them.
  const removeCode = useCallback((code: string): void => {
    const index = codesRef.current.indexOf(code);
    if (index !== -1) codesRef.current.splice(index, 1);
  }, []);

  // Inserts or repositions `order`. Does NOT bump the revision — callers batch
  // their own bump() after one or more calls.
  const insertOne = useCallback(
    (order: Order): void => {
      const code = order.orderCode;
      const existing = ordersRef.current.get(code);
      const resolved = existing ? pickNewerOrder(existing, order) : order;
      if (existing) removeCode(code);
      ordersRef.current.set(code, resolved);
      const key = computeDeliverySortKey(resolved);
      sortKeysRef.current.set(code, key);
      const index = findSortedInsertIndex(
        codesRef.current,
        key,
        sortKeysRef.current,
      );
      codesRef.current.splice(index, 0, code);
    },
    [removeCode],
  );

  const deleteOne = useCallback(
    (code: string): void => {
      removeCode(code);
      ordersRef.current.delete(code);
      sortKeysRef.current.delete(code);
    },
    [removeCode],
  );

  const fetchOrders = useCallback(
    async (params: OrderListParams) => {
      lastParams.current = params;
      const id = ++requestId.current;
      addedSinceFetch.current = [];
      setLoading(true);
      try {
        const result = await getOrders(params);
        // A newer request started meanwhile — don't let this older one win.
        if (id !== requestId.current) return;

        // Rebuild from the fetched page, row by row: a row with a mutation in
        // flight keeps its local copy, otherwise the higher version wins.
        // Order/membership follow the fetched page (same contract the old
        // `mergeFetchedOrders` had).
        const previous = ordersRef.current;
        const locked = lockedRef.current;
        ordersRef.current = new Map();
        codesRef.current = [];
        sortKeysRef.current = new Map();
        for (const row of result.orders) {
          const current = previous.get(row.orderCode);
          const resolved = !current
            ? row
            : locked.has(row.orderCode)
              ? current
              : pickNewerOrder(current, row);
          ordersRef.current.set(row.orderCode, resolved);
          codesRef.current.push(row.orderCode);
          sortKeysRef.current.set(
            row.orderCode,
            computeDeliverySortKey(resolved),
          );
        }

        const fetchedCodes = new Set(result.orders.map((row) => row.orderCode));
        const missing = addedSinceFetch.current.filter(
          (row) => !fetchedCodes.has(row.orderCode),
        );
        for (const row of missing) insertOne(row);

        setRowCount(result.rowCount + missing.length);
        bump();
      } catch (error) {
        if (id !== requestId.current) return;
        handleError(error, "ORDER_LIST_FAILED");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [handleError, bump, insertOne],
  );

  const refresh = useCallback(async () => {
    if (lastParams.current) await fetchOrders(lastParams.current);
  }, [fetchOrders]);

  // Puts a freshly created order into the current rows without a list call.
  const addOrder = useCallback(
    (order: Order) => {
      addedSinceFetch.current.push(order);
      insertOne(order);
      setRowCount((count) => count + 1);
      bump();
    },
    [bump, insertOne],
  );

  // Puts a freshly fetched copy of one order into the current rows (found by
  // its code); the row keeps its position and a newer local version wins. A
  // no-op for an unknown code (doesn't insert).
  const syncOrder = useCallback(
    (order: Order) => {
      if (!ordersRef.current.has(order.orderCode)) return;
      insertOne(order);
      bump();
    },
    [bump, insertOne],
  );

  // Saves an edited order and patches its row in place — no list call, no page
  // jump. Holds the same per-order lock as a status change, so the two can't
  // overlap. Errors (stale conflict included) propagate to the caller/form.
  const saveOrder = useCallback(
    async (payload: UpdateOrderPayload) => {
      if (!lockOrder(payload.orderCode)) throw new ApiError("ORDER_BUSY", 409);
      try {
        const { order: saved, traceId } = await updateOrderApi(payload);
        // The backend's own trace ID for this mutation, echoed on its
        // response — a client-generated one was tried and confirmed not
        // honored by the backend, so this is claimed after the fact instead.
        if (traceId) claimTraceId?.(traceId);
        // Never let the row's version fall behind what was just written.
        const version = Math.max(saved.version, payload.version + 1);
        insertOne({ ...saved, version });
        bump();
      } finally {
        unlockOrder(payload.orderCode);
      }
    },
    [lockOrder, unlockOrder, bump, claimTraceId, insertOne],
  );

  const changeStatus = useCallback(
    async (order: Order, status: OrderStatus) => {
      // A second change on the same order while one is in flight is dropped
      // (it would carry a stale version anyway); other orders are unaffected.
      if (!lockOrder(order.orderCode)) return;
      let stale = false;
      try {
        // Status changes emit their own ORDER_UPDATED SSE echo too, so this
        // needs the same dedup as saveOrder — previously this endpoint's
        // response was discarded entirely and never claimed anything, so
        // every status change unconditionally double-toasted.
        const { traceId } = await updateOrderStatusApi({
          code: order.orderCode,
          status,
          version: order.version,
        });
        if (traceId) claimTraceId?.(traceId);
        const current = ordersRef.current.get(order.orderCode);
        if (current) {
          // Status doesn't affect the sort key — a direct Map.set, no reposition.
          ordersRef.current.set(order.orderCode, {
            ...current,
            status,
            version: current.version + 1,
          });
          bump();
        }
        notify("Cập nhật trạng thái đơn thành công", "success");
      } catch (error) {
        if (isStaleOrderError(error)) stale = true;
        else handleError(error, "ORDER_STATUS_FAILED");
      } finally {
        unlockOrder(order.orderCode);
      }
      // Reload only after unlocking, otherwise the merge would keep the stale row.
      if (stale) {
        notify(
          "Đơn hàng đã được cập nhật bởi người khác, đang tải lại...",
          "warning",
        );
        await refresh();
      }
    },
    [notify, handleError, refresh, lockOrder, unlockOrder, bump, claimTraceId],
  );

  // Applies a batch of live SSE events (length 1 in the common case, larger
  // under a burst — see OrderNotificationProvider's ~200ms flush). Mutates
  // the internal structures per event with no intermediate bump(), then bumps
  // exactly once for the whole batch — this is what turns a burst of N events
  // into one re-render instead of N.
  const applyOrderEvents = useCallback(
    (events: OrderNotificationEvent[], activeFilters: OrdersFilterState) => {
      if (events.length === 0) return;
      let rowCountDelta = 0;
      let changed = false;

      for (const { eventType, order: incoming } of events) {
        const code = incoming.orderCode;
        // A local mutation is in flight for this order — let it win; the
        // eventual saveOrder/changeStatus result supersedes this echo anyway.
        if (lockedRef.current.has(code)) continue;
        const current = ordersRef.current.get(code);

        if (eventType === "ORDER_CREATED") {
          if (current) continue; // already have it — skip
          if (matchesOrderFilters(incoming, activeFilters)) {
            insertOne(incoming);
            rowCountDelta += 1;
            changed = true;
          }
          continue;
        }

        // ORDER_UPDATED
        if (current && incoming.version < current.version) continue; // stale echo

        if (!current) {
          // Absent locally: treat as new, but only if it belongs in this view.
          if (matchesOrderFilters(incoming, activeFilters)) {
            insertOne(incoming);
            rowCountDelta += 1;
            changed = true;
          }
          continue;
        }

        if (!matchesOrderFilters(incoming, activeFilters)) {
          // Filter-conflict edge case: no longer belongs in the active view.
          deleteOne(code);
          rowCountDelta -= 1;
          changed = true;
          continue;
        }

        insertOne(incoming); // repositions if delivery date changed
        changed = true;
      }

      if (rowCountDelta !== 0) {
        setRowCount((count) => Math.max(0, count + rowCountDelta));
      }
      if (changed) bump();
    },
    [bump, insertOne, deleteOne],
  );

  return {
    orders,
    rowCount,
    loading,
    pendingCodes,
    fetchOrders,
    refresh,
    addOrder,
    syncOrder,
    saveOrder,
    changeStatus,
    applyOrderEvents,
    editingCodeRef,
    setEditingCode,
  };
}
