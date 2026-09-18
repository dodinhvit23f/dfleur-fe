"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isStaleOrderError } from "@/lib/api/orders";
import { uploadSampleFile } from "@/lib/api/upload";
import { useApiErrorHandler } from "@/lib/api/useApiErrorHandler";
import { useNotification } from "@/providers/NotificationProvider";
import {
  areOrderFormValuesEqual,
  buildOrder,
  computeOrderTotals,
  firstOrderError,
  type OrderFormErrors,
  type OrderFormValues,
  type OrderImage,
  rebaseOrderFormValues,
  validateOrder,
} from "./orderForm";
import type { CreateOrderPayload } from "./orderUtils";

const STALE_MESSAGE =
  "Đơn hàng vừa được người khác cập nhật. Đã giữ chỉnh sửa của bạn — hãy kiểm tra rồi lưu lại.";

export interface UseOrderFormOptions {
  /**
   * What the form starts from and "unchanged" is measured against. Passing a
   * different object later (a fresh copy after a conflict) rebases the draft
   * onto it instead of discarding the user's edits.
   */
  initialValues: OrderFormValues;
  /** Persist the built order. Throwing keeps the form open with its data. */
  onSubmit: (order: CreateOrderPayload) => Promise<void> | void;
  successMessage: string;
  /** Called after a successful submit (the modal closes here). */
  onSuccess?: () => void;
  /** Blank values to reset to after a successful submit; omit to keep the form as saved. */
  resetOnSuccess?: () => OrderFormValues;
  /** `onSubmit` was rejected as an optimistic-lock conflict: fetch fresh data. */
  onStale?: () => Promise<unknown>;
}

export interface UploadProgress {
  done: number;
  total: number;
}

export function useOrderForm({
  initialValues,
  onSubmit,
  successMessage,
  onSuccess,
  resetOnSuccess,
  onStale,
}: UseOrderFormOptions) {
  const { notify } = useNotification();
  const handleError = useApiErrorHandler();
  const [values, setValues] = useState(initialValues);
  const [base, setBase] = useState(initialValues);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [conflicts, setConflicts] = useState<(keyof OrderFormValues)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const submittingRef = useRef(false);
  // Files already uploaded during a failed attempt — a retry skips them.
  const uploadedRef = useRef(new WeakMap<File, string>());

  // Rebase the draft when `initialValues` is replaced (not on first render).
  const latest = useRef({ values, base });
  latest.current = { values, base };
  const seenInitial = useRef(initialValues);
  useEffect(() => {
    if (seenInitial.current === initialValues) return;
    seenInitial.current = initialValues;
    const rebased = rebaseOrderFormValues(
      latest.current.base,
      latest.current.values,
      initialValues,
    );
    setValues(rebased.values);
    setBase(initialValues);
    setErrors({});
    setConflicts(rebased.conflicts);
  }, [initialValues]);

  const totals = useMemo(() => computeOrderTotals(values), [values]);
  const dirty = useMemo(
    () => !areOrderFormValuesEqual(values, base),
    [values, base],
  );

  const setField = useCallback(
    <K extends keyof OrderFormValues>(key: K, value: OrderFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const { [key]: _resolved, ...rest } = prev;
        return rest;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setValues(base);
    setErrors({});
    setConflicts([]);
  }, [base]);

  const dismissConflicts = useCallback(() => setConflicts([]), []);

  // Only new Files are uploaded; existing URLs pass through. The result keeps
  // the order of `images`.
  const uploadImages = async (images: OrderImage[]): Promise<string[]> => {
    const files = images.filter(
      (image): image is File => image instanceof File,
    );
    const pending = files.filter((file) => !uploadedRef.current.has(file));
    let done = 0;
    setProgress({ done, total: pending.length });
    for (const file of pending) {
      const url = await uploadSampleFile(file);
      uploadedRef.current.set(file, url);
      done += 1;
      setProgress({ done, total: pending.length });
    }
    return images.map((image) =>
      image instanceof File
        ? (uploadedRef.current.get(image) as string)
        : image,
    );
  };

  const submit = async () => {
    if (submittingRef.current) return;

    const found = validateOrder(values);
    setErrors(found);
    const message = firstOrderError(found);
    if (message) {
      notify(message, "error");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const urls = await uploadImages(values.images);
      await onSubmit(buildOrder(values, urls));
      notify(successMessage, "success");
      setConflicts([]);
      if (resetOnSuccess) {
        const blank = resetOnSuccess();
        setValues(blank);
        setBase(blank);
      } else {
        setBase(values);
      }
      onSuccess?.();
    } catch (error) {
      if (isStaleOrderError(error)) {
        notify(STALE_MESSAGE, "warning");
        await onStale?.();
      } else {
        handleError(error);
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setProgress(null);
    }
  };

  return {
    values,
    errors,
    conflicts,
    dirty,
    totals,
    setField,
    reset,
    dismissConflicts,
    submit,
    submitting,
    progress,
  };
}
