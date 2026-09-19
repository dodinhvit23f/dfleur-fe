"use client";

import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { NOTIFICATION_TTL_MS } from "@/lib/notificationStore";
import { useOrderNotifications } from "@/providers/OrderNotificationProvider";

const DRAWER_WIDTH = 360;

export interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const { notifications, markAllRead, markRead } = useOrderNotifications();

  // Notifications expire on a TTL; while the drawer is open, tick periodically
  // so an expired entry visibly drops off without requiring a new event.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tick is a re-filter trigger, not read in the body
  const visible = useMemo(() => {
    const now = Date.now();
    return notifications.filter(
      (n) => now - n.receivedAt <= NOTIFICATION_TTL_MS,
    );
  }, [notifications, tick]);

  return (
    <Drawer
      anchor="right"
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          width: DRAWER_WIDTH,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6">Thông báo</Typography>
        <Button
          size="small"
          onClick={markAllRead}
          disabled={visible.length === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </Box>
      <Divider />
      {visible.length === 0 ? (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary">Không có thông báo</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {visible.map((n) => (
            <ListItemButton
              key={n.id}
              onClick={() => markRead(n.id)}
              sx={{
                alignItems: "flex-start",
                bgcolor: n.read ? "transparent" : "action.hover",
              }}
            >
              <ListItemText
                primary={n.message}
                slotProps={{
                  primary: { sx: { fontWeight: n.read ? 400 : 600 } },
                }}
                secondary={formatDistanceToNow(new Date(n.receivedAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Drawer>
  );
}
