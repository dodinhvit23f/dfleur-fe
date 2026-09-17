"use client";

import { Box, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { QRGenerator } from "@/components/qr/QRGenerator";
import { otpGenerateApi, otpVerifyApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { ErrorMessage, getErrorCode } from "@/lib/api/errors";
import { STORAGE_KEYS } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";

export function QrGeneratorView() {
  const router = useRouter();
  const { notify } = useNotification();
  const [qrData, setQrData] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const otpToken = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
    if (!otpToken) {
      router.replace("/");
      return;
    }

    otpGenerateApi()
      .then(setQrData)
      .catch((error) => {
        const code = getErrorCode(error, "OTP_GENERATE_FAILED");
        notify(ErrorMessage.getMessage(code), "error");
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [router, notify]);

  const handleConfirm = async (otp: string) => {
    try {
      await otpVerifyApi(otp);
      notify("Xác thực OTP thành công", "success");
      router.push("/");
    } catch (error) {
      const code = getErrorCode(error, "OTP_VERIFY_FAILED");
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
        notify(ErrorMessage.getMessage(code), "error");
        router.replace("/");
        return;
      }
      notify(ErrorMessage.getMessage(code), "error");
      throw error;
    }
  };

  return (
    <AuthPageShell title="Thiết lập xác thực 2 lớp">
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
