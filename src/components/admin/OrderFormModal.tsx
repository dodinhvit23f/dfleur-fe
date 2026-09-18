"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  AppBar,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef, type ReactElement, type ReactNode, type Ref } from "react";

const SlideTransition = forwardRef(function SlideTransition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export interface OrderFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
}

export function OrderFormModal({
  open,
  onClose,
  title,
  closeLabel,
  children,
}: OrderFormModalProps) {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      slots={{ transition: SlideTransition }}
    >
      <AppBar color="default" sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="default"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <CloseRoundedIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      <DialogContent sx={{ bgcolor: "background.default", p: 0 }}>
        {children}
      </DialogContent>
    </Dialog>
  );
}
