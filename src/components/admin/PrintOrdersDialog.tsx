"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
} from "@mui/material";
import type { Order } from "./orderUtils";
import { PrintableBills } from "./PrintableBills";
import { useBillPrint } from "./useBillPrint";

export interface PrintOrdersDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
}

export function PrintOrdersDialog({
  open,
  onClose,
  orders,
}: PrintOrdersDialogProps) {
  const {
    contentRef,
    includeImages,
    setIncludeImages,
    staffName,
    printedAt,
    isPrinting,
    handlePrint,
  } = useBillPrint(orders, open);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {`In hóa đơn (${orders.length} đơn)`}
        <IconButton onClick={onClose} aria-label="Đóng">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeImages}
                onChange={(event) => setIncludeImages(event.target.checked)}
              />
            }
            label="Bao gồm ảnh mẫu sản phẩm"
          />
          <Box
            sx={{
              overflow: "auto",
              maxHeight: "70vh",
              bgcolor: "action.hover",
              borderRadius: 1,
              p: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <PrintableBills
              ref={contentRef}
              orders={orders}
              staffName={staffName}
              includeImages={includeImages}
              printedAt={printedAt}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Huỷ</Button>
        <Button
          variant="contained"
          startIcon={<PrintRoundedIcon />}
          loading={isPrinting}
          onClick={() => handlePrint()}
        >
          In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
