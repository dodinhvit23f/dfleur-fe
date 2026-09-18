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
import type { Order, OrderStatus } from "./orderUtils";

export function useOrders() {
  const { notify } = useNotification();
  const handleError = useApiErrorHandler();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const lastParams = useRef<OrderListParams | null>(null);

  const fetchOrders = useCallback(
    async (params: OrderListParams) => {
      lastParams.current = params;
      const id = ++requestId.current;
      setLoading(true);
      try {
        const result = await getOrders(params);
        // A newer request started meanwhile — don't let this older one win.
        if (id !== requestId.current) return;
        setOrders(result.orders);
        setRowCount(result.rowCount);
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

  const changeStatus = useCallback(
    async (order: Order, status: OrderStatus) => {
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
        if (isStaleOrderError(error)) {
          notify(
            "Đơn hàng đã được cập nhật bởi người khác, đang tải lại...",
            "warning",
          );
          await refresh();
          return;
        }
        handleError(error, "ORDER_STATUS_FAILED");
      }
    },
    [notify, handleError, refresh],
  );

  return { orders, rowCount, loading, fetchOrders, refresh, changeStatus };
}
