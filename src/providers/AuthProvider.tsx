"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { refreshTokenApi, verifyTokenApi } from "@/lib/api/auth";
import { getRoleHomeRoute } from "@/lib/roles";
import { clearAuthStorage, readStoredRoles, STORAGE_KEYS } from "@/lib/storage";

const PUBLIC_PATHS = ["/", "/subscribe", "/signup"];
const PUBLIC_PREFIXES = ["/auth"]; // covers /auth/login, /auth/qr/*, /auth/forgot-password

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(!isPublicPath(pathname));

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (isPublicPath(pathname)) {
        const hasToken = Boolean(
          localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        );
        if (hasToken) {
          router.replace(getRoleHomeRoute(readStoredRoles()));
        }
        if (!cancelled) setChecking(false);
        return;
      }

      setChecking(true);
      const ok = await verifyTokenApi();
      if (cancelled) return;

      if (!ok) {
        try {
          const { accessToken, refreshToken } = await refreshTokenApi();
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        } catch {
          if (!cancelled) {
            clearAuthStorage();
            router.replace("/");
          }
          return;
        }
      }

      if (
        pathname.startsWith("/admin") &&
        !readStoredRoles().includes("ADMIN")
      ) {
        router.replace(getRoleHomeRoute(readStoredRoles()));
        return;
      }

      if (!cancelled) setChecking(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking) return null;
  return <>{children}</>;
}
