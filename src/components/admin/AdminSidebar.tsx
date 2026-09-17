"use client";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { defaultNavItems } from "./mockData";

export interface NavItem {
  label: string;
  href: string;
  icon: "home" | "cart";
}

const ICON_MAP: Record<NavItem["icon"], ReactElement> = {
  home: <HomeRoundedIcon fontSize="small" />,
  cart: <ShoppingCartRoundedIcon fontSize="small" />,
};

export interface AdminSidebarProps {
  items?: NavItem[];
  onNavigate?: () => void;
}

function BotanicalMotif() {
  const theme = useTheme();
  return (
    <Box
      component="svg"
      viewBox="0 0 200 200"
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 160,
        pointerEvents: "none",
        opacity: 0.5,
      }}
    >
      <path
        d="M0 200 C 20 140, 10 90, 50 60 C 80 38, 60 10, 40 0"
        fill="none"
        stroke={alpha(theme.palette.secondary.main, 0.4)}
        strokeWidth={3}
      />
      <path
        d="M0 200 C 30 160, 40 120, 80 100 C 110 84, 100 50, 70 30"
        fill="none"
        stroke={alpha(theme.palette.text.secondary, 0.3)}
        strokeWidth={2}
      />
      <ellipse
        cx={44}
        cy={16}
        rx={14}
        ry={8}
        fill={alpha(theme.palette.secondary.main, 0.3)}
        transform="rotate(-30 44 16)"
      />
      <ellipse
        cx={82}
        cy={92}
        rx={16}
        ry={9}
        fill={alpha(theme.palette.primary.main, 0.2)}
        transform="rotate(-20 82 92)"
      />
    </Box>
  );
}

export function AdminSidebar({
  items = defaultNavItems,
  onNavigate,
}: AdminSidebarProps) {
  const theme = useTheme();
  const pathname = usePathname();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        bgcolor: "background.paper",
        borderRight: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 3, py: 4 }}>
        <Typography variant="h6" color="primary.main">
          D Fleur
        </Typography>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: 1.5 }}
        >
          Home of Flower Lovers
        </Typography>
      </Box>
      <List sx={{ px: 2, flexGrow: 1 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              selected={active}
              sx={{
                borderRadius: 24,
                mb: 0.5,
                color: active ? "primary.main" : "text.primary",
                bgcolor: active
                  ? alpha(theme.palette.primary.main, 0.12)
                  : "transparent",
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                },
                "&.Mui-selected:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: active ? "primary.main" : "text.secondary",
                }}
              >
                {ICON_MAP[item.icon]}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontWeight: active ? 600 : 500 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <BotanicalMotif />
    </Box>
  );
}
