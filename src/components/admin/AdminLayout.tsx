"use client";

import MenuIcon from "@mui/icons-material/MenuRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export const DRAWER_WIDTH = 280;
const APPBAR_HEIGHT = 72;
// Space the shell keeps above and below the page content (px), so a page that
// wants to fill the viewport can size itself with ADMIN_CONTENT_CHROME.
const CONTENT_TOP_GAP = { xs: 24, md: 32 } as const;
const CONTENT_BOTTOM_PAD = { xs: 24, md: 40 } as const;
export const ADMIN_CONTENT_CHROME = {
  xs: APPBAR_HEIGHT + CONTENT_TOP_GAP.xs + CONTENT_BOTTOM_PAD.xs,
  md: APPBAR_HEIGHT + CONTENT_TOP_GAP.md + CONTENT_BOTTOM_PAD.md,
} as const;

export interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          bgcolor: "background.paper",
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ minHeight: APPBAR_HEIGHT }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              color="text.primary"
              sx={{ lineHeight: 1.2 }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton>
            <PersonOutlineRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              border: "none",
            },
          }}
        >
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              border: "none",
            },
          }}
        >
          <AdminSidebar />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: "background.default",
          minHeight: "100vh",
          pt: `${APPBAR_HEIGHT}px`,
          px: { xs: 2, md: 4 },
          pb: {
            xs: `${CONTENT_BOTTOM_PAD.xs}px`,
            md: `${CONTENT_BOTTOM_PAD.md}px`,
          },
        }}
      >
        <Box
          sx={{
            mt: {
              xs: `${CONTENT_TOP_GAP.xs}px`,
              md: `${CONTENT_TOP_GAP.md}px`,
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
