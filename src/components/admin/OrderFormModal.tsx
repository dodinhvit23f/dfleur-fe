"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Slide,
  Toolbar,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import {
  forwardRef,
  type ReactElement,
  type ReactNode,
  type Ref,
  useState,
} from "react";

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
  /** Unsaved changes: closing asks for confirmation first. */
  dirty?: boolean;
  children: ReactNode;
}

export function OrderFormModal({
  open,
  onClose,
  title,
  closeLabel,
  dirty = false,
  children,
}: OrderFormModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestClose = () => {
    if (dirty) setConfirmOpen(true);
    else onClose();
  };

  const discardAndClose = () => {
    setConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={requestClose}
        slots={{ transition: SlideTransition }}
      >
        <AppBar color="default" sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="default"
              onClick={requestClose}
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Bỏ các thay đổi chưa lưu?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn đã chỉnh sửa nhưng chưa lưu. Nếu đóng bây giờ, các thay đổi sẽ
            bị mất.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            Tiếp tục chỉnh sửa
          </Button>
          <Button color="error" onClick={discardAndClose}>
            Bỏ thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
