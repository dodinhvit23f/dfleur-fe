"use client";

import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { type SyntheticEvent, useState } from "react";
import { loginApi } from "@/lib/api/auth";
import { ErrorMessage, getErrorCode } from "@/lib/api/errors";
import { STORAGE_KEYS } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";

const MIN_LENGTH = 6;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifySuccess, notifyError } = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    let isValid = true;

    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    } else if (username.trim().length < MIN_LENGTH) {
      setUsernameError(`Username must be at least ${MIN_LENGTH} characters`);
      isValid = false;
    } else {
      setUsernameError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < MIN_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_LENGTH} characters`);
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const isFormValid =
    username.trim().length >= MIN_LENGTH && password.length >= MIN_LENGTH;

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const { otpToken, requiredGenerateOTP } = await loginApi(
        username,
        password,
      );
      localStorage.setItem(STORAGE_KEYS.OTP_TOKEN, otpToken);
      notifySuccess("Đăng nhập thành công");
      router.push(
        requiredGenerateOTP ? "/auth/qr/generator" : "/auth/qr/verify",
      );
    } catch (error) {
      const code = getErrorCode(error, "LOGIN_FAILED");
      notifyError(
        ErrorMessage.getMessage(
          code,
          "Tài khoản đăng nhập hoặc mật khẩu không đúng",
        ),
      );
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url(/login_background.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(8px)",
          backgroundColor: (theme) => alpha(theme.palette.common.black, 0.25),
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: { xs: 360, sm: 420 },
          mx: 2,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          backgroundColor: (theme) =>
            alpha(theme.palette.background.paper, 0.72),
          backdropFilter: "blur(16px)",
          border: (theme) =>
            `1px solid ${alpha(theme.palette.common.white, 0.4)}`,
          boxShadow: (theme) =>
            `0 8px 32px ${alpha(theme.palette.text.primary, 0.18)}`,
        }}
      >
        <Stack spacing={0.5} sx={{ alignItems: "center", mb: 3 }}>
          <Typography variant="h4" color="primary.main">
            D'Fluer
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back — sign in to continue
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <TextField
              id="login-username"
              name="username"
              label="Username"
              fullWidth
              variant="outlined"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              error={Boolean(usernameError)}
              helperText={usernameError}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              id="login-password"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              variant="outlined"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={Boolean(passwordError)}
              helperText={passwordError}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ textAlign: "right" }}>
              <Typography
                component="a"
                href="#"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: "none",
                  "&:hover": { color: "primary.main" },
                }}
              >
                Forgot Password?
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Login"
              )}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
