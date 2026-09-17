export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ROLES: "roles",
  OTP_TOKEN: "OTP_TOKEN",
  TENANT: "tenant",
} as const;

export function getTenant(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem(STORAGE_KEYS.TENANT) || "default";
}

export function readStoredRoles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROLES);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ROLES);
  localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
}
