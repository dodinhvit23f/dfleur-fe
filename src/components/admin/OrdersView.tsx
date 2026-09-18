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
import { ADMIN_CONTENT_CHROME, AdminLayout } from "./AdminLayout";
import { OrderForm } from "./OrderForm";
import { OrderFormModal } from "./OrderFormModal";
import { OrdersFilterToolbar } from "./OrdersFilterToolbar";
import { OrdersTable } from "./OrdersTable";
import {
  type CreateOrderPayload,
  emptyOrdersFilterState,
  type OrdersFilterState,
} from "./orderUtils";
import { SliceImages } from "./SliceImages";
import { useOrders } from "./useOrders";
import { useStaffOptions } from "./useStaffOptions";

export function OrdersView() {
  const { notify } = useNotification();
  const { saleOptions, floristOptions } = useStaffOptions();
  const {
    orders,
    rowCount,
    loading,
    pendingCodes,
    fetchOrders,
    refresh,
    addOrder,
    changeStatus,
  } = useOrders();
  const [filters, setFilters] = useState(emptyOrdersFilterState);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [samplePictureFilePreview, setSamplePictureFilePreview] = useState<
    string[]
  >([]);

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
      const created = await createOrderApi(payload);
      // No list call: put the created order straight into the rows. If the
      // response isn't a usable order, fall back to reloading the list.
      if (created?.orderCode) addOrder(created);
      else await refresh();
    },
    [addOrder, refresh],
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
          onNewOrder={() => setCreateOpen(true)}
        />
        <OrdersTable
          orders={orders}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={loading}
          onImageClick={handleImageClick}
          onStatusChange={changeStatus}
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
        onClose={() => setCreateOpen(false)}
        title="Tạo đơn hàng mới"
        closeLabel="Đóng"
      >
        <OrderForm
          saleOptions={saleOptions}
          floristOptions={floristOptions}
          onSubmit={handleCreateOrder}
        />
      </OrderFormModal>
    </AdminLayout>
  );
}
