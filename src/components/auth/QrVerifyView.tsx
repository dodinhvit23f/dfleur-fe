"use client";

import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { CodeVerification } from "@/components/qr/CodeVerification";
import { otpLoginApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { ErrorMessage, getErrorCode } from "@/lib/api/errors";
import { getRoleHomeRoute } from "@/lib/roles";
import { STORAGE_KEYS } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";

const COUNTDOWN_SECONDS = 180;
const MAX_ATTEMPTS = 5;

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function QrVerifyView() {
  const router = useRouter();
  const { notify } = useNotification();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptError, setAttemptError] = useState<string>();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.OTP_TOKEN)) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (locked || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [locked, secondsLeft]);

  useEffect(() => {
    if (secondsLeft > 0 || locked) return;
    setLocked(true);
    localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
    notify("Mã OTP đã hết hạn. Vui lòng đăng nhập lại.", "error");
    router.replace("/");
  }, [secondsLeft, locked, notify, router]);

  const lockOut = (message: string) => {
    setLocked(true);
    localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
    notify(message, "error");
    router.replace("/");
  };

  const handleConfirm = async (code: string) => {
    if (locked || isSubmitting) return;
    setIsSubmitting(true);
    setAttemptError(undefined);
    try {
      const result = await otpLoginApi(code);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(result.roles));
      localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
      notify("Xác thực thành công!", "success");
      router.push(getRoleHomeRoute(result.roles));
    } catch (error) {
      const errorCode = getErrorCode(error, "OTP_LOGIN_FAILED");
      const status = error instanceof ApiError ? error.status : undefined;

      if (status === 401 || errorCode === "OTP_TOKEN_MISSING") {
        lockOut(ErrorMessage.getMessage(errorCode));
        return;
      }
      if (errorCode === "OTP_RATE_LIMITED") {
        lockOut(ErrorMessage.getMessage(errorCode));
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        lockOut("Bạn đã nhập sai quá nhiều lần. Vui lòng đăng nhập lại.");
        return;
      }
      setAttemptError(
        `${ErrorMessage.getMessage(errorCode)} (còn ${MAX_ATTEMPTS - nextAttempts} lần thử)`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell title="Xác thực 2 lớp">
      <Typography
        variant="body2"
        sx={{ textAlign: "center", color: "text.secondary" }}
      >
        Mã hết hạn sau {formatTime(Math.max(secondsLeft, 0))}
      </Typography>
      <CodeVerification
        codeLength={6}
        loading={isSubmitting}
        disabled={locked || secondsLeft <= 0}
        externalError={attemptError}
        onConfirm={handleConfirm}
      />
    </AuthPageShell>
  );
}
