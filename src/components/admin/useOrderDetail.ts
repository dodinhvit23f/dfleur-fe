"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getOrderDetail } from "@/lib/api/orders";
import { useApiErrorHandler } from "@/lib/api/useApiErrorHandler";
import type { Order } from "./orderUtils";

/**
 * Loads one order by code (null = nothing selected). `reload()` refetches and
 * resolves to the fresh order, or null if that failed.
 */
export function useOrderDetail(code: string | null) {
  const handleError = useApiErrorHandler();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(code));
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(
    async (target: string): Promise<Order | null> => {
      const id = ++requestId.current;
      setLoading(true);
      setFailed(false);
      try {
        const loaded = await getOrderDetail(target);
        if (id !== requestId.current) return null;
        setOrder(loaded);
        return loaded;
      } catch (error) {
        if (id !== requestId.current) return null;
        setFailed(true);
        handleError(error, "ORDER_DETAIL_FAILED");
        return null;
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [handleError],
  );

  useEffect(() => {
    requestId.current += 1; // drop any response for the previous code
    setOrder(null);
    setFailed(false);
    if (code) void load(code);
    else setLoading(false);
  }, [code, load]);

  const reload = useCallback(
    () => (code ? load(code) : Promise.resolve(null)),
    [code, load],
  );

  return { order, loading, failed, reload };
}
