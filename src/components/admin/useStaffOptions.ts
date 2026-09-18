"use client";

import { useEffect, useState } from "react";
import { getFloristUsernames, getSaleUsernames } from "@/lib/api/orders";

/** Sale / florist account names for the filter toolbar and the order form. */
export function useStaffOptions() {
  const [saleOptions, setSaleOptions] = useState<string[]>([]);
  const [floristOptions, setFloristOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSaleUsernames(), getFloristUsernames()])
      .then(([sales, florists]) => {
        if (cancelled) return;
        setSaleOptions(sales);
        setFloristOptions(florists);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  return { saleOptions, floristOptions };
}
