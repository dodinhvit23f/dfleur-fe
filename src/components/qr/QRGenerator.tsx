"use client";

import { CheckCircle } from "@mui/icons-material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { type ChangeEvent, type ClipboardEvent, useState } from "react";
import QRCode from "react-qr-code";
import { useNotification } from "@/providers/NotificationProvider";

interface QRGeneratorProps {
  qrData?: string;
  onConfirm: (otp: string) => Promise<void>;
}

function extractSecret(qrData?: string): string {
  if (!qrData) return "";
  try {
    return new URL(qrData).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

export function QRGenerator({ qrData, onConfirm }: QRGeneratorProps) {
  const theme = useTheme();
  const { notify } = useNotification();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totpSecret = extractSecret(qrData);

  const handleCopySecret = async () => {
    if (!totpSecret) return;
    try {
      await navigator.clipboard.writeText(totpSecret);
      notify("Đã sao chép mã bí mật", "success");
    } catch {
      notify("Không thể sao chép. Vui lòng thử lại.", "error");
    }
  };

  const handleOtpChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, "");
    if (value.length <= 6) setOtp(value);
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    setOtp(event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    if (otp.length !== 6) {
      notify("Vui lòng nhập đầy đủ số OTP", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirm(otp);
    } catch {
      notify("Mã OTP không chính xác. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!qrData) return null;

  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          padding: "24px",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "2px solid #D0D0D0",
          display: "inline-flex",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
          maxWidth: "100%",
        }}
      >
        <Box
          sx={{
            width: { xs: 200, sm: 250 },
            height: { xs: 200, sm: 250 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <QRCode
            value={qrData}
            size={250}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </Box>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: "13px",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Quét mã QR này với ứng dụng xác thực (Google Authenticator, Authy...)
      </Typography>

      {totpSecret && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            backgroundColor: "#F5F5F5",
            borderRadius: "8px",
            px: 1.5,
            py: 0.5,
            maxWidth: "100%",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "monospace",
              fontSize: "13px",
              letterSpacing: "0.05em",
              wordBreak: "break-all",
            }}
          >
            {totpSecret}
          </Typography>
          <Tooltip title="Sao chép mã bí mật">
            <IconButton
              size="small"
              onClick={handleCopySecret}
              aria-label="copy secret"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      <TextField
        label="Mã OTP"
        placeholder="Nhập Số OTP"
        fullWidth
        variant="outlined"
        value={otp}
        onChange={handleOtpChange}
        onPaste={handleOtpPaste}
        autoComplete="one-time-code"
        slotProps={{
          htmlInput: { maxLength: 6, inputMode: "numeric", pattern: "[0-9]*" },
        }}
        sx={{
          "& .MuiOutlinedInput-input": {
            padding: "12px 16px",
            fontSize: "16px",
            textAlign: "center",
            letterSpacing: "0.5em",
            fontWeight: 600,
          },
        }}
      />

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={
          isSubmitting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <CheckCircle />
          )
        }
        onClick={handleConfirm}
        disabled={isSubmitting || otp.length !== 6}
        sx={{ height: "48px" }}
      >
        {isSubmitting ? "Đang xác thực..." : "Xác nhận"}
      </Button>
    </Stack>
  );
}
