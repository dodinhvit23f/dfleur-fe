"use client";

import { Stack } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { AdminLayout } from "./AdminLayout";
import { defaultOrders } from "./mockData";
import { OrdersFilterToolbar } from "./OrdersFilterToolbar";
import { OrdersTable } from "./OrdersTable";
import { emptyOrdersFilterState, filterOrders } from "./orderUtils";
import { SliceImages } from "./SliceImages";

export function OrdersView() {
  const { notify } = useNotification();
  const [filters, setFilters] = useState(emptyOrdersFilterState);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [samplePictureFilePreview, setSamplePictureFilePreview] = useState<
    string[]
  >([]);

  const filteredOrders = useMemo(
    () => filterOrders(defaultOrders, filters),
    [filters],
  );

  const handleImageClick = useCallback((links: string[]) => {
    setSamplePictureFilePreview(links);
    setGalleryOpen(true);
  }, []);

  return (
    <AdminLayout title="D'Fleur Admin Panel - Orders List">
      <Stack spacing={3}>
        <OrdersFilterToolbar
          orders={defaultOrders}
          filters={filters}
          onFiltersChange={setFilters}
          onExport={() => notify("Export to Excel started", "info")}
          onPrint={() => notify("Preparing orders for print", "info")}
        />
        <OrdersTable orders={filteredOrders} onImageClick={handleImageClick} />
      </Stack>
      <SliceImages
        open={galleryOpen}
        images={samplePictureFilePreview}
        onClose={() => setGalleryOpen(false)}
      />
    </AdminLayout>
  );
}
