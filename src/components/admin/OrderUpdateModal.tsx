"use client";

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccount } from "@/lib/storage";
import { useNotification } from "@/providers/NotificationProvider";
import { OrderForm } from "./OrderForm";
import { OrderFormModal } from "./OrderFormModal";
import { orderToFormValues } from "./orderForm";
import type {
  CreateOrderPayload,
  Order,
  UpdateOrderPayload,
} from "./orderUtils";
import { useOrderDetail } from "./useOrderDetail";

interface SaveProps {
  saleOptions: string[];
  floristOptions: string[];
  /** Persist the edit and patch the list row (see `useOrders.saveOrder`). */
  saveOrder: (payload: UpdateOrderPayload) => Promise<void>;
  /** Put a freshly fetched copy of the order into the list. */
  syncOrder: (order: Order) => void;
  /** An SSE ORDER_UPDATED for this same order, arrived while the modal is open. */
  externalUpdate?: (Order & { actor: string }) | null;
  onExternalUpdateConsumed?: () => void;
}

interface ContentProps extends SaveProps {
  code: string;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

// Mounted only while the modal is open, so every open loads the order afresh.
function OrderUpdateContent({
  code,
  onClose,
  onDirtyChange,
  saleOptions,
  floristOptions,
  saveOrder,
  syncOrder,
  externalUpdate,
  onExternalUpdateConsumed,
}: ContentProps) {
  const { notify } = useNotification();
  const { order, failed, loading, reload } = useOrderDetail(code);
  // An SSE-delivered fresh copy takes over from the loaded `order` as the
  // form's source, without a network round-trip (the SSE payload already IS
  // the fresh order).
  const [freshFromSse, setFreshFromSse] = useState<Order | null>(null);
  const activeOrder = freshFromSse ?? order;
  const initialValues = useMemo(
    () => (activeOrder ? orderToFormValues(activeOrder) : null),
    [activeOrder],
  );

  useEffect(() => {
    if (!externalUpdate || externalUpdate.orderCode !== code) return;
    syncOrder(externalUpdate);
    setFreshFromSse(externalUpdate);
    notify(`Đơn hàng vừa được cập nhật bởi ${externalUpdate.actor}`, "warning");
    onExternalUpdateConsumed?.();
  }, [externalUpdate, code, syncOrder, notify, onExternalUpdateConsumed]);

  const handleSubmit = useCallback(
    async (payload: CreateOrderPayload) => {
      if (!activeOrder) return;
      await saveOrder({
        ...payload,
        // The create payload omits an empty florist; an edit must clear it.
        floristAccount: payload.floristAccount ?? "",
        orderCode: activeOrder.orderCode,
        version: activeOrder.version,
        status: activeOrder.status,
        editor: getAccount(),
      });
    },
    [activeOrder, saveOrder],
  );

  // Someone else saved first: reload; the form rebases the user's draft onto
  // the fresh copy and the list row is refreshed too. The reload is more
  // authoritative than any earlier SSE copy, so it takes over.
  const handleStale = useCallback(async () => {
    const fresh = await reload();
    if (fresh) {
      syncOrder(fresh);
      setFreshFromSse(null);
    }
  }, [reload, syncOrder]);

  if (!activeOrder || !initialValues) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          py: 10,
        }}
      >
        {failed && !loading ? (
          <>
            <Typography color="text.secondary">
              Không thể tải đơn hàng.
            </Typography>
            <Button variant="outlined" onClick={() => void reload()}>
              Thử lại
            </Button>
          </>
        ) : (
          <CircularProgress aria-label="Đang tải đơn hàng" />
        )}
      </Box>
    );
  }

  return (
    <OrderForm
      saleOptions={saleOptions}
      floristOptions={floristOptions}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      successMessage="Cập nhật đơn hàng thành công"
      submitLabel="Lưu thay đổi"
      resetLabel="Hoàn tác"
      requireChange
      onSuccess={onClose}
      onStale={handleStale}
      onDirtyChange={onDirtyChange}
    />
  );
}

export interface OrderUpdateModalProps extends SaveProps {
  /** The order being edited. Keep it set while the modal animates closed. */
  code: string | null;
  open: boolean;
  onClose: () => void;
}

export function OrderUpdateModal({
  code,
  open,
  onClose,
  ...rest
}: OrderUpdateModalProps) {
  const [dirty, setDirty] = useState(false);

  const handleClose = () => {
    setDirty(false);
    onClose();
  };

  return (
    <OrderFormModal
      open={open}
      onClose={handleClose}
      title={code ? `Cập nhật đơn hàng ${code}` : "Cập nhật đơn hàng"}
      closeLabel="Đóng"
      dirty={dirty}
    >
      {code && (
        <OrderUpdateContent
          code={code}
          onClose={handleClose}
          onDirtyChange={setDirty}
          {...rest}
        />
      )}
    </OrderFormModal>
  );
}
