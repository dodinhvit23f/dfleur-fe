"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { uploadSampleFile } from "@/lib/api/upload";
import { useApiErrorHandler } from "@/lib/api/useApiErrorHandler";
import { useNotification } from "@/providers/NotificationProvider";
import {
  buildOrder,
  type CreateOrderPayload,
  computeOrderTotals,
  createEmptyOrderFormValues,
  type OrderFormValues,
  validateOrder,
} from "./orderUtils";

export interface UseOrderFormOptions {
  /** Persist the built order. Throwing keeps the form open with its data. */
  onSubmit: (order: CreateOrderPayload) => Promise<void> | void;
  /** Called after a successful submit + reset (the modal closes here). */
  onSuccess?: () => void;
}

export interface UploadProgress {
  done: number;
  total: number;
}

export function useOrderForm({ onSubmit, onSuccess }: UseOrderFormOptions) {
  const { notify } = useNotification();
  const handleError = useApiErrorHandler();
  const [values, setValues] = useState<OrderFormValues>(
    createEmptyOrderFormValues,
  );
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const submittingRef = useRef(false);
  // Files already uploaded during a failed attempt — a retry skips them.
  const uploadedRef = useRef(new WeakMap<File, string>());

  const totals = useMemo(() => computeOrderTotals(values), [values]);

  const setField = useCallback(
    <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const reset = useCallback(() => setValues(createEmptyOrderFormValues()), []);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const pending = files.filter((file) => !uploadedRef.current.has(file));
    let done = 0;
    setProgress({ done, total: pending.length });
    for (const file of pending) {
      const url = await uploadSampleFile(file);
      uploadedRef.current.set(file, url);
      done += 1;
      setProgress({ done, total: pending.length });
    }
    return files.map((file) => uploadedRef.current.get(file) as string);
  };

  const submit = async () => {
    if (submittingRef.current) return;

    const validationError = validateOrder(values);
    if (validationError) {
      notify(validationError, "error");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const urls = await uploadImages(values.images);
      await onSubmit(buildOrder(values, urls));
      notify("Tạo đơn hàng thành công", "success");
      reset();
      onSuccess?.();
    } catch (error) {
      handleError(error);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setProgress(null);
    }
  };

  return { values, totals, setField, reset, submit, submitting, progress };
}
