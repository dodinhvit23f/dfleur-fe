export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  ROLES: "roles",
  OTP_TOKEN: "OTP_TOKEN",
  TENANT: "tenant",
  TIER_DATA: "tierData",
} as const;

export function getTenant(): string {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem(STORAGE_KEYS.TENANT) || "default";
}

export function setTenant(tenant: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.TENANT, tenant);
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

// Partial cleanup for a failed/expired mid-OTP-flow step — intentionally keeps
// TENANT so the flow can be re-entered for the same platform.
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ROLES);
  localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
}

// Full logout / invalid-session wipe, including TENANT and TIER_DATA.
export function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ROLES);
  localStorage.removeItem(STORAGE_KEYS.OTP_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TENANT);
  localStorage.removeItem(STORAGE_KEYS.TIER_DATA);
}
