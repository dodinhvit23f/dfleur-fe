"use client";

import { Stack } from "@mui/material";
import { useMemo, useState } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { AdminLayout } from "./AdminLayout";
import { defaultOrders } from "./mockData";
import { OrdersFilterToolbar } from "./OrdersFilterToolbar";
import { OrdersTable } from "./OrdersTable";
import { emptyOrdersFilterState, filterOrders } from "./orderUtils";

export function OrdersView() {
  const { notify } = useNotification();
  const [filters, setFilters] = useState(emptyOrdersFilterState);

  const filteredOrders = useMemo(
    () => filterOrders(defaultOrders, filters),
    [filters],
  );

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
        <OrdersTable orders={filteredOrders} />
      </Stack>
    </AdminLayout>
  );
}
