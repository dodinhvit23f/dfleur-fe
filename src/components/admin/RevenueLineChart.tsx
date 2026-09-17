"use client";

import { Card, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import { defaultRevenueSeries } from "./mockData";

export interface RevenueSeriesPoint {
  day: number;
  thisMonth: number;
  previousMonth: number;
}

export interface RevenueLineChartProps {
  data?: RevenueSeriesPoint[];
  height?: number;
}

export function RevenueLineChart({
  data = defaultRevenueSeries,
  height = 320,
}: RevenueLineChartProps) {
  const theme = useTheme();

  return (
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Key-Value Pair and Trend Analysis
      </Typography>
      <LineChart
        height={height}
        xAxis={[
          {
            data: data.map((d) => d.day),
            scaleType: "point",
            label: "Day",
          },
        ]}
        series={[
          {
            id: "thisMonth",
            label: "This Month Revenue",
            data: data.map((d) => d.thisMonth),
            color: theme.palette.primary.main,
            curve: "natural",
            area: true,
            showMark: false,
          },
          {
            id: "previousMonth",
            label: "Previous Month Revenue",
            data: data.map((d) => d.previousMonth),
            color: theme.palette.secondary.main,
            curve: "natural",
            area: true,
            showMark: false,
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
