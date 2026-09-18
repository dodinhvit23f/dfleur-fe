"use client";

import { Box, Stack } from "@mui/material";
import { AdminLayout } from "./AdminLayout";
import { DebtBarChart } from "./DebtBarChart";
import { FinancialOverviewCard } from "./FinancialOverviewCard";
import { RevenueLineChart } from "./RevenueLineChart";

export function AdminDashboardView() {
  return (
    <AdminLayout title="Trang Chủ">
      <Stack spacing={3}>
        <FinancialOverviewCard />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <RevenueLineChart />
          <DebtBarChart />
        </Box>
      </Stack>
    </AdminLayout>
  );
}
