"use client";

import { CheckCircle } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";

interface CodeVerificationProps {
  onConfirm: (code: string) => void;
  codeLength?: number;
  loading?: boolean;
  disabled?: boolean;
  externalError?: string;
}

export function CodeVerification({
  onConfirm,
  codeLength = 6,
  loading = false,
  disabled = false,
  externalError,
}: CodeVerificationProps) {
  const theme = useTheme();
  const [code, setCode] = useState<string[]>(Array(codeLength).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, codeLength);
      if (digits.length > 0) {
        const newCode = Array(codeLength).fill("");
        digits.split("").forEach((char, idx) => {
          newCode[idx] = char;
        });
        setCode(newCode);
        setError("");
        inputRefs.current[Math.min(digits.length, codeLength - 1)]?.focus();
      }
      return;
    }
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");
    if (value && index < codeLength - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < codeLength - 1)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").slice(0, codeLength);
    if (!/^\d+$/.test(pastedData)) return;
    const newCode = [...code];
    pastedData.split("").forEach((char, idx) => {
      if (idx < codeLength) newCode[idx] = char;
    });
    setCode(newCode);
    setError("");
    inputRefs.current[Math.min(pastedData.length, codeLength - 1)]?.focus();
  };

  const handleConfirm = () => {
    const fullCode = code.join("");
    if (fullCode.length !== codeLength) {
      setError(`Vui lòng nhập đầy đủ ${codeLength} chữ số`);
      return;
    }
    onConfirm(fullCode);
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <Stack spacing={3}>
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        Nhập mã {codeLength} chữ số từ ứng dụng xác thực
      </Typography>

      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
        {code.map((digit, index) => (
          <TextField
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length digit grid, order never changes
            key={index}
            inputRef={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              handleChange(index, event.target.value)
            }
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) =>
              handleKeyDown(index, event)
            }
            onPaste={handlePaste}
            slotProps={{
              htmlInput: {
                maxLength: 1,
                inputMode: "numeric",
                pattern: "[0-9]*",
                style: {
                  textAlign: "center",
                  fontSize: "24px",
                  fontWeight: 600,
                  padding: "16px 0",
                },
              },
            }}
            sx={{ width: { xs: "48px", sm: "56px" } }}
          />
        ))}
      </Stack>

      {(externalError || error) && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.error.main,
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          {externalError || error}
        </Typography>
      )}

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        <Link
          href="/"
          underline="hover"
          sx={{ color: theme.palette.text.secondary, fontSize: "14px" }}
        >
          Quay lại trang chủ
        </Link>
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={
          loading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <CheckCircle />
          )
        }
        onClick={handleConfirm}
        disabled={!isCodeComplete || loading || disabled}
        sx={{ height: "56px" }}
      >
        {loading ? "Đang xác thực..." : "Xác nhận"}
      </Button>
    </Stack>
  );
}
