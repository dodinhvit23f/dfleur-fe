"use client";

import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { ReactNode } from "react";
import AuthProvider from "@/providers/AuthProvider";
import NotificationProvider from "@/providers/NotificationProvider";
import OrderNotificationProvider from "@/providers/OrderNotificationProvider";
import theme from "@/theme";

export default function ThemeRegistry({
  children,
  bodyClassName,
}: {
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          component="body"
          suppressHydrationWarning
          className={bodyClassName}
          sx={{ margin: 0 }}
        >
          <NotificationProvider>
            {/* Wraps AuthProvider (not nested inside it): AuthProvider
                remounts its subtree (returns null while re-checking) on every
                route change, which would otherwise tear down and reconnect
                the app-wide SSE stream on every navigation. */}
            <OrderNotificationProvider>
              <AuthProvider>{children}</AuthProvider>
            </OrderNotificationProvider>
          </NotificationProvider>
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
