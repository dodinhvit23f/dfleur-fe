"use client";

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AuthPageShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        py: 3,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "500px" }}>
        <Paper
          elevation={4}
          sx={{
            borderRadius: "24px",
            padding: { xs: "24px", sm: "32px", md: "48px" },
            backgroundColor: "rgba(250, 247, 245, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 8px 32px 0 rgba(109, 76, 65, 0.15)",
          }}
        >
          <Stack spacing={3}>
            <Typography
              variant="h4"
              color="primary.main"
              sx={{ textAlign: "center" }}
            >
              {title}
            </Typography>
            {children}
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
