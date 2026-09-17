"use client";

import { Menu, MenuItem } from "@mui/material";
import { ORDER_STATUS_VALUES, type OrderStatus, trans } from "./orderUtils";

export interface StatusChangeMenuProps {
  anchorEl: HTMLElement | null;
  currentStatus: OrderStatus | null;
  onClose: () => void;
  onSelect: (status: OrderStatus) => void;
}

export function StatusChangeMenu({
  anchorEl,
  currentStatus,
  onClose,
  onSelect,
}: StatusChangeMenuProps) {
  const options = ORDER_STATUS_VALUES.filter(
    (status) => status !== currentStatus,
  );

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      {options.map((status) => (
        <MenuItem
          key={status}
          onClick={() => {
            onSelect(status);
            onClose();
          }}
        >
          {trans(status)}
        </MenuItem>
      ))}
    </Menu>
  );
}
