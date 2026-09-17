"use client";

import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { QRGenerator } from "@/components/qr/QRGenerator";
import { otpResetGenerateApi, otpResetVerifyApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { getRoleHomeRoute } from "@/lib/roles";
import { clearSession, readStoredRoles, STORAGE_KEYS } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";

export function OtpResetView() {
  const router = useRouter();
  const { notify } = useNotification();
  const [qrData, setQrData] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      router.replace("/");
      return;
    }

    otpResetGenerateApi()
      .then(setQrData)
      .catch((error) => {
        const code =
          error instanceof ApiError ? error.code : "OTP_GENERATE_FAILED";
        notify(getErrorMessage(code), "error");
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [router, notify]);

  const handleConfirm = async (otp: string) => {
    try {
      await otpResetVerifyApi(otp);
      notify("Đặt lại 2FA thành công", "success");
      router.push(getRoleHomeRoute(readStoredRoles()));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "OTP_VERIFY_FAILED";
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        notify(getErrorMessage(code), "error");
        router.replace("/");
        return;
      }
      notify(getErrorMessage(code), "error");
      throw error;
    }
  };

  return (
    <AuthPageShell title="Đặt lại xác thực 2 lớp">
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <QRGenerator qrData={qrData} onConfirm={handleConfirm} />
      )}
    </AuthPageShell>
  );
}
