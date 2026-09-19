"use client";

import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { Badge, IconButton } from "@mui/material";
import { useOrderNotifications } from "@/providers/OrderNotificationProvider";

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { unreadCount } = useOrderNotifications();

  return (
    <IconButton onClick={onClick} aria-label="Thông báo đơn hàng">
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <NotificationsRoundedIcon />
      </Badge>
    </IconButton>
  );
}
