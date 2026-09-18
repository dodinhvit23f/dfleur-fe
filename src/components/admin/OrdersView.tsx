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
import { AdminLayout } from "./AdminLayout";
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
import { useDebouncedValue } from "./useDebouncedValue";
import { useOrders } from "./useOrders";
import { useStaffOptions } from "./useStaffOptions";

const SEARCH_DEBOUNCE_MS = 400;

export function OrdersView() {
  const { notify } = useNotification();
  const { saleOptions, floristOptions } = useStaffOptions();
  const { orders, rowCount, loading, fetchOrders, refresh, changeStatus } =
    useOrders();
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

  const debouncedSearch = useDebouncedValue(
    filters.search.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const params = useMemo<OrderListParams>(
    () => ({
      page: paginationModel.page,
      size: paginationModel.pageSize,
      search: debouncedSearch,
      startDate: filters.deliveryStart,
      endDate: filters.deliveryEnd,
      statuses: filters.statuses,
      saleAccounts: filters.salers,
      floristAccounts: filters.florists,
    }),
    [
      paginationModel,
      debouncedSearch,
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
      await createOrderApi(payload);
      // Show the new order: jump to page 1 (that triggers the refetch), or
      // refetch in place if we're already there.
      if (paginationModel.page === 0) await refresh();
      else setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [paginationModel.page, refresh],
  );

  const handleImageClick = useCallback((links: string[]) => {
    setSamplePictureFilePreview(links);
    setGalleryOpen(true);
  }, []);

  return (
    <AdminLayout title="D'Fleur Admin Panel - Orders List">
      <Stack spacing={3}>
        <OrdersFilterToolbar
          saleOptions={saleOptions}
          floristOptions={floristOptions}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onExport={() => notify("Export to Excel started", "info")}
          onPrint={() => notify("Preparing orders for print", "info")}
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
