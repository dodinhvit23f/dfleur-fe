"use client";

import { useCallback, useRef, useState } from "react";
import {
  getOrders,
  isStaleOrderError,
  type OrderListParams,
  updateOrderStatusApi,
} from "@/lib/api/orders";
import { useApiErrorHandler } from "@/lib/api/useApiErrorHandler";
import { useNotification } from "@/providers/NotificationProvider";
import {
  insertOrderSorted,
  mergeFetchedOrders,
  type Order,
  type OrderStatus,
} from "./orderUtils";

export function useOrders() {
  const { notify } = useNotification();
  const handleError = useApiErrorHandler();
  const [orders, setOrders] = useState<Order[]>([]);
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
        const fetchedCodes = new Set(result.orders.map((row) => row.orderCode));
        const missing = addedSinceFetch.current.filter(
          (row) => !fetchedCodes.has(row.orderCode),
        );
        const locked = new Set(lockedRef.current);
        setOrders((prev) =>
          missing.reduce(
            (rows, added) => insertOrderSorted(rows, added),
            mergeFetchedOrders(prev, result.orders, locked),
          ),
        );
        setRowCount(result.rowCount + missing.length);
      } catch (error) {
        if (id !== requestId.current) return;
        handleError(error, "ORDER_LIST_FAILED");
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [handleError],
  );

  const refresh = useCallback(async () => {
    if (lastParams.current) await fetchOrders(lastParams.current);
  }, [fetchOrders]);

  // Puts a freshly created order into the current rows without a list call.
  const addOrder = useCallback((order: Order) => {
    addedSinceFetch.current.push(order);
    setOrders((prev) => insertOrderSorted(prev, order));
    setRowCount((count) => count + 1);
  }, []);

  const changeStatus = useCallback(
    async (order: Order, status: OrderStatus) => {
      // A second change on the same order while one is in flight is dropped
      // (it would carry a stale version anyway); other orders are unaffected.
      if (!lockOrder(order.orderCode)) return;
      let stale = false;
      try {
        await updateOrderStatusApi({
          code: order.orderCode,
          status,
          version: order.version,
        });
        setOrders((prev) =>
          prev.map((row) =>
            row.orderCode === order.orderCode
              ? { ...row, status, version: row.version + 1 }
              : row,
          ),
        );
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
    [notify, handleError, refresh, lockOrder, unlockOrder],
  );

  return {
    orders,
    rowCount,
    loading,
    pendingCodes,
    fetchOrders,
    refresh,
    addOrder,
    changeStatus,
  };
}
