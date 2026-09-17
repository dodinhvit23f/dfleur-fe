import type { Metadata } from "next";
import { OrdersView } from "@/components/admin/OrdersView";

export const metadata: Metadata = {
  title: "Orders — D'Fluer Admin",
  description: "Order management for D Fleur admin",
};

export default function Page() {
  return <OrdersView />;
}
