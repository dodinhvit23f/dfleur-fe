import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Bảng điều khiển — D'Fluer Admin",
  description: "Trang tổng quan quản trị của D Fleur",
};

export default function Page() {
  return <AdminDashboardView />;
}
