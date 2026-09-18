import type { Metadata } from "next";
import { OrdersView } from "@/components/admin/OrdersView";

export const metadata: Metadata = {
  title: "Đơn hàng — D'Fluer Admin",
  description: "Quản lý đơn hàng cho quản trị viên D Fleur",
};

export default function Page() {
  return <OrdersView />;
}
