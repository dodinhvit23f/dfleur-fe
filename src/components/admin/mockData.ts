import type { NavItem } from "./AdminSidebar";
import type { DebtComparisonPoint } from "./DebtBarChart";
import type { FinancialMetric } from "./FinancialOverviewCard";
import type { RevenueSeriesPoint } from "./RevenueLineChart";

export const defaultNavItems: NavItem[] = [
  { label: "Trang Chủ", href: "/admin", icon: "home" },
  { label: "Đơn Hàng", href: "/admin/orders", icon: "cart" },
];

export const defaultFinancialMetrics: FinancialMetric[] = [
  {
    label: "This Month Revenue",
    value: 14500,
    trend: { value: 27, direction: "up" },
  },
  { label: "Previous Month Revenue", value: 12800, trend: null },
  {
    label: "This Month Debt",
    value: 2100,
    trend: { value: 8, direction: "down" },
  },
  { label: "Previous Month Debt", value: 1950, trend: null },
];

export const defaultFinancialNotes: string[] = [
  "Revenue grew 27% month-over-month, driven by strong seasonal demand.",
  "Debt increased slightly (+8%) but remains well below revenue growth.",
  "Overall margin trend is positive heading into next month.",
];

export const defaultRevenueSeries: RevenueSeriesPoint[] = [
  { day: 0, thisMonth: 1200, previousMonth: 900 },
  { day: 5, thisMonth: 3400, previousMonth: 2600 },
  { day: 10, thisMonth: 5800, previousMonth: 4900 },
  { day: 17, thisMonth: 9100, previousMonth: 7800 },
  { day: 20, thisMonth: 11600, previousMonth: 10200 },
  { day: 25, thisMonth: 14500, previousMonth: 12800 },
];

export const defaultDebtComparison: DebtComparisonPoint[] = [
  { category: "Revenue", thisMonth: 14500, previousMonth: 12800 },
  { category: "Total Debt", thisMonth: 2100, previousMonth: 1950 },
];
