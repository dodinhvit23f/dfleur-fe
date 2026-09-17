"use client";

import { Logout } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearAuthStorage } from "@/lib/storage";

export function LogoutView() {
  const router = useRouter();

  useEffect(() => {
    clearAuthStorage();
    const timer = setTimeout(() => {
      router.push("/auth/login");
    }, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      <Logout sx={{ fontSize: 64, color: "primary.main" }} />
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Đang đăng xuất...
      </Typography>
      <CircularProgress />
    </Box>
  );
}
