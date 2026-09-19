"use client";

import { Stack } from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildOrderQuery,
  createOrderApi,
  type OrderListParams,
} from "@/lib/api/orders";
import { useNotification } from "@/providers/NotificationProvider";
import { useOrderNotifications } from "@/providers/OrderNotificationProvider";
import { ADMIN_CONTENT_CHROME, AdminLayout } from "./AdminLayout";
import { OrderForm } from "./OrderForm";
import { OrderFormModal } from "./OrderFormModal";
import { OrdersFilterToolbar } from "./OrdersFilterToolbar";
import { OrdersTable } from "./OrdersTable";
import { OrderUpdateModal } from "./OrderUpdateModal";
import { createEmptyOrderFormValues } from "./orderForm";
import {
  type CreateOrderPayload,
  emptyOrdersFilterState,
  type Order,
  type OrdersFilterState,
} from "./orderUtils";
import { SliceImages } from "./SliceImages";
import { useOrders } from "./useOrders";
import { useStaffOptions } from "./useStaffOptions";

export function OrdersView() {
  const { notify } = useNotification();
  const { saleOptions, floristOptions } = useStaffOptions();
  const { subscribe, subscribeReconnect, claimTraceId } =
    useOrderNotifications();
  const {
    orders,
    rowCount,
    loading,
    pendingCodes,
    fetchOrders,
    refresh,
    addOrder,
    syncOrder,
    saveOrder,
    changeStatus,
    applyOrderEvents,
    setEditingCode,
  } = useOrders(claimTraceId);
  const [filters, setFilters] = useState(emptyOrdersFilterState);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] = useState(
    createEmptyOrderFormValues,
  );
  const [createDirty, setCreateDirty] = useState(false);
  // `code` stays set while the edit modal animates closed.
  const [editing, setEditing] = useState<{
    code: string | null;
    open: boolean;
  }>({ code: null, open: false });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [samplePictureFilePreview, setSamplePictureFilePreview] = useState<
    string[]
  >([]);
  // An SSE ORDER_UPDATED for the order currently open in the edit modal —
  // handed to OrderUpdateModal so it can rebase the user's in-progress draft
  // instead of the background row silently changing underneath them.
  const [externalUpdate, setExternalUpdate] = useState<
    (Order & { actor: string }) | null
  >(null);

  useEffect(() => {
    setEditingCode(editing.open ? editing.code : null);
  }, [editing, setEditingCode]);

  const params = useMemo<OrderListParams>(
    () => ({
      page: paginationModel.page,
      size: paginationModel.pageSize,
      search: filters.search.trim(),
      startDate: filters.deliveryStart,
      endDate: filters.deliveryEnd,
      statuses: filters.statuses,
      saleAccounts: filters.salers,
      floristAccounts: filters.florists,
    }),
    [
      paginationModel,
      filters.search,
      filters.deliveryStart,
      filters.deliveryEnd,
      filters.statuses,
      filters.salers,
      filters.florists,
    ],
  );

  // Refetch only when the effective query changes, not on every new array/Date
  // identity in `params`.
  const queryKey = buildOrderQuery(params);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  // biome-ignore lint/correctness/useExhaustiveDependencies: queryKey is the serialized form of paramsRef.current
  useEffect(() => {
    void fetchOrders(paramsRef.current);
  }, [queryKey, fetchOrders]);

  const handleFiltersChange = useCallback((next: OrdersFilterState) => {
    setFilters(next);
    setPaginationModel((prev) =>
      prev.page === 0 ? prev : { ...prev, page: 0 },
    );
  }, []);

  const handleCreateOrder = useCallback(
    async (payload: CreateOrderPayload) => {
      const { order: created, traceId } = await createOrderApi(payload);
      if (traceId) claimTraceId(traceId);
      // No list call: put the created order straight into the rows. If the
      // response isn't a usable order, fall back to reloading the list.
      if (created?.orderCode) addOrder(created);
      else await refresh();
    },
    [addOrder, refresh, claimTraceId],
  );

  // Live order events (batched, length 1 in the common case) -> local state.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(
    () =>
      subscribe((events) => {
        applyOrderEvents(events, filtersRef.current);
        const relevant = events.find(
          (e) =>
            e.eventType === "ORDER_UPDATED" &&
            editing.open &&
            editing.code === e.order.orderCode,
        );
        if (relevant) {
          setExternalUpdate({ ...relevant.order, actor: relevant.actor });
        }
      }),
    [subscribe, applyOrderEvents, editing.open, editing.code],
  );

  // No replay on the backend: every reconnect after the first may have missed
  // events, so refetch the current page.
  useEffect(
    () => subscribeReconnect(() => void refresh()),
    [subscribeReconnect, refresh],
  );

  const handleImageClick = useCallback((links: string[]) => {
    setSamplePictureFilePreview(links);
    setGalleryOpen(true);
  }, []);

  return (
    <AdminLayout title="D'Fleur Admin Panel - Orders List">
      {/* Fills the viewport under the shell: the toolbar keeps its height and the
          table takes the rest, so only the table scrolls, not the page. */}
      <Stack
        spacing={3}
        sx={{
          height: {
            xs: `calc(100vh - ${ADMIN_CONTENT_CHROME.xs}px)`,
            md: `calc(100vh - ${ADMIN_CONTENT_CHROME.md}px)`,
          },
        }}
      >
        <OrdersFilterToolbar
          saleOptions={saleOptions}
          floristOptions={floristOptions}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={() => notify("Đang xuất Excel", "info")}
          onPrint={() => notify("Đang chuẩn bị in", "info")}
          onNewOrder={() => {
            setCreateInitial(createEmptyOrderFormValues());
            setCreateOpen(true);
          }}
        />
        <OrdersTable
          orders={orders}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          onImageClick={handleImageClick}
          onStatusChange={changeStatus}
          onOrderOpen={(code) => setEditing({ code, open: true })}
          pendingCodes={pendingCodes}
        />
      </Stack>
      <SliceImages
        open={galleryOpen}
        images={samplePictureFilePreview}
        onClose={() => setGalleryOpen(false)}
      />
      <OrderFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateDirty(false);
        }}
        title="Tạo đơn hàng mới"
        closeLabel="Đóng"
        dirty={createDirty}
      >
        <OrderForm
          saleOptions={saleOptions}
          floristOptions={floristOptions}
          initialValues={createInitial}
          onSubmit={handleCreateOrder}
          successMessage="Tạo đơn hàng thành công"
          submitLabel="Tạo đơn hàng"
          resetLabel="Đặt lại"
          resetOnSuccess={createEmptyOrderFormValues}
          onDirtyChange={setCreateDirty}
        />
      </OrderFormModal>
      <OrderUpdateModal
        code={editing.code}
        open={editing.open}
        onClose={() => setEditing((prev) => ({ ...prev, open: false }))}
        saleOptions={saleOptions}
        floristOptions={floristOptions}
        saveOrder={saveOrder}
        syncOrder={syncOrder}
        externalUpdate={externalUpdate}
        onExternalUpdateConsumed={() => setExternalUpdate(null)}
      />
    </AdminLayout>
  );
}
