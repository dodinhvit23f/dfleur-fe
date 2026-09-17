"use client";

import { Card, Typography } from "@mui/material";
import { darken, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { defaultDebtComparison } from "./mockData";

export interface DebtComparisonPoint {
  category: "Revenue" | "Total Debt";
  thisMonth: number;
  previousMonth: number;
}

export interface DebtBarChartProps {
  data?: DebtComparisonPoint[];
  height?: number;
}

export function DebtBarChart({
  data = defaultDebtComparison,
  height = 320,
}: DebtBarChartProps) {
  const theme = useTheme();
  const revenue = data.find((d) => d.category === "Revenue");
  const debt = data.find((d) => d.category === "Total Debt");

  return (
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Revenue vs. Debt Comparison
      </Typography>
      <BarChart
        height={height}
        xAxis={[
          {
            scaleType: "band",
            data: ["This Month", "Previous Month"],
          },
        ]}
        series={[
          {
            id: "revenue",
            label: "Revenue",
            data: [revenue?.thisMonth ?? 0, revenue?.previousMonth ?? 0],
            color: theme.palette.primary.main,
          },
          {
            id: "totalDebt",
            label: "Total Debt",
            data: [debt?.thisMonth ?? 0, debt?.previousMonth ?? 0],
            color: darken(theme.palette.secondary.main, 0.25),
          },
        ]}
        grid={{ horizontal: true }}
        slotProps={{
          legend: { position: { vertical: "top", horizontal: "end" } },
        }}
        sx={{
          "& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-series text": {
            fontFamily: theme.typography.fontFamily,
          },
          "& .MuiChartsGrid-line": {
            stroke: theme.palette.divider,
          },
        }}
      />
    </Card>
  );
}
