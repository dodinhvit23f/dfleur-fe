import { getTenant, STORAGE_KEYS } from "@/lib/storage";
import { ApiError, postJson, requireEnv } from "./client";

export interface LoginResult {
  haveMFA: boolean;
  otpToken: string;
  requiredGenerateOTP: boolean;
}

export const loginApi = async (
  username: string,
  password: string,
  tenant?: string,
): Promise<LoginResult> => {
  const url = requireEnv(
    "NEXT_PUBLIC_API_LOGIN",
    process.env.NEXT_PUBLIC_API_LOGIN,
  );
  const response = await postJson<{ data: LoginResult }>(
    url,
    { username, password},
    { fallbackErrorCode: "LOGIN_FAILED" },
  );
  return response.data;
};

function requireOtpToken(): string {
  const token = localStorage.getItem(STORAGE_KEYS.OTP_TOKEN);
  if (!token) throw new ApiError("OTP_TOKEN_MISSING", 401);
  return token;
}

function requireAccessToken(): string {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) throw new ApiError("UNAUTHORIZED", 401);
  return token;
}

export const otpGenerateApi = async (): Promise<string> => {
  const otpToken = requireOtpToken();
  const url = requireEnv(
    "NEXT_PUBLIC_API_OTP_GENERATE",
    process.env.NEXT_PUBLIC_API_OTP_GENERATE,
  );
  const response = await postJson<{ data: string }>(
    url,
    { tenant: getTenant() },
    { authorization: otpToken, fallbackErrorCode: "OTP_GENERATE_FAILED" },
  );
  return response.data;
};

export const otpVerifyApi = async (otp: string): Promise<boolean> => {
  const otpToken = requireOtpToken();
  const url = requireEnv(
    "NEXT_PUBLIC_API_OTP_VERIFY",
    process.env.NEXT_PUBLIC_API_OTP_VERIFY,
  );
  const response = await postJson<{ data: boolean }>(
    url,
    { otp, tenant: getTenant() },
    { authorization: otpToken, fallbackErrorCode: "OTP_VERIFY_FAILED" },
  );
  return response.data;
};

export interface OtpLoginResult {
  accessToken: string;
  refreshToken: string;
  roles: string[];
}

export const otpLoginApi = async (otp: string): Promise<OtpLoginResult> => {
  const otpToken = requireOtpToken();
  const url = requireEnv(
    "NEXT_PUBLIC_API_LOGIN_WITH_OTP",
    process.env.NEXT_PUBLIC_API_LOGIN_WITH_OTP,
  );
  const response = await postJson<{ data: OtpLoginResult }>(
    url,
    { otp, tenant: getTenant() },
    { authorization: otpToken, fallbackErrorCode: "OTP_LOGIN_FAILED" },
  );
  return response.data;
};

// Authenticated reset flow — same endpoints, Bearer accessToken instead of OTP_TOKEN.
// Confirm with backend that these endpoints accept Bearer <accessToken> for an
// already-logged-in caller; if not, swap in dedicated "reset MFA" endpoints.
export const otpResetGenerateApi = async (): Promise<string> => {
  const accessToken = requireAccessToken();
  const url = requireEnv(
    "NEXT_PUBLIC_API_OTP_GENERATE",
    process.env.NEXT_PUBLIC_API_OTP_GENERATE,
  );
  const response = await postJson<{ data: string }>(
    url,
    { tenant: getTenant() },
    {
      authorization: `Bearer ${accessToken}`,
      fallbackErrorCode: "OTP_GENERATE_FAILED",
    },
  );
  return response.data;
};

export const otpResetVerifyApi = async (otp: string): Promise<boolean> => {
  const accessToken = requireAccessToken();
  const url = requireEnv(
    "NEXT_PUBLIC_API_OTP_VERIFY",
    process.env.NEXT_PUBLIC_API_OTP_VERIFY,
  );
  const response = await postJson<{ data: boolean }>(
    url,
    { otp, tenant: getTenant() },
    {
      authorization: `Bearer ${accessToken}`,
      fallbackErrorCode: "OTP_VERIFY_FAILED",
    },
  );
  return response.data;
};

export const verifyTokenApi = async (): Promise<boolean> => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) return false;
  const url = requireEnv(
    "NEXT_PUBLIC_API_VERIFY_TOKEN",
    process.env.NEXT_PUBLIC_API_VERIFY_TOKEN,
  );
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const refreshTokenApi = async (): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) throw new ApiError("UNAUTHORIZED", 401);
  const url = requireEnv(
    "NEXT_PUBLIC_API_REFRESH_TOKEN",
    process.env.NEXT_PUBLIC_API_REFRESH_TOKEN,
  );
  const response = await postJson<{
    data: { accessToken: string; refreshToken: string };
  }>(
    url,
    { refreshToken },
    {
      authorization: `Bearer ${refreshToken}`,
      fallbackErrorCode: "UNAUTHORIZED",
    },
  );
  return response.data;
};
