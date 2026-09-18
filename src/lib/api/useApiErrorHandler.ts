"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { clearSession } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { ApiError } from "./client";
import { ErrorMessage, getErrorCode } from "./errors";

/**
 * Shared catch-block handling: a 401 clears the session and bounces to `/`,
 * anything else becomes a Vietnamese error toast.
 */
export function useApiErrorHandler() {
  const router = useRouter();
  const { notify } = useNotification();

  return useCallback(
    (error: unknown, fallbackCode = "UNKNOWN_ERROR") => {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        notify(ErrorMessage.getMessage("UNAUTHORIZED"), "error");
        router.replace("/");
        return;
      }
      notify(
        ErrorMessage.getMessage(getErrorCode(error, fallbackCode)),
        "error",
      );
    },
    [router, notify],
  );
}
