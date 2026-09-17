"use client";

import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { ReactNode } from "react";
import AuthProvider from "@/providers/AuthProvider";
import NotificationProvider from "@/providers/NotificationProvider";
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
            <AuthProvider>{children}</AuthProvider>
          </NotificationProvider>
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
