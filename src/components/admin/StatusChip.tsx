"use client";

import { Chip, type ChipProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { OrderStatusVariant } from "./orderUtils";

export interface StatusChipProps {
  status: OrderStatusVariant;
  label: string;
  clickable?: boolean;
  disabled?: boolean;
  onClick?: ChipProps["onClick"];
  size?: ChipProps["size"];
}

export function StatusChip({
  status,
  label,
  clickable,
  disabled,
  onClick,
  size = "small",
}: StatusChipProps) {
  const theme = useTheme();

  const palette: Record<OrderStatusVariant, { bg: string; fg: string }> = {
    success: {
      bg: alpha(theme.palette.success.main, 0.14),
      fg: theme.palette.success.dark,
    },
    warning: {
      bg: alpha(theme.palette.warning.main, 0.16),
      fg: theme.palette.warning.dark,
    },
    error: {
      bg: alpha(theme.palette.error.main, 0.12),
      fg: theme.palette.error.dark,
    },
    info: {
      bg: alpha(theme.palette.info.main, 0.14),
      fg: theme.palette.info.dark,
    },
    cancelled: {
      bg: alpha(theme.palette.text.secondary, 0.16),
      fg: theme.palette.text.secondary,
    },
  };

  const { bg, fg } = palette[status];

  return (
    <Chip
      size={size}
      label={label}
      clickable={clickable}
      disabled={disabled}
      onClick={onClick}
      sx={{
        bgcolor: bg,
        color: fg,
        fontWeight: 500,
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    />
  );
}
