import type { Metadata } from "next";
import { AdminDashboardView } from "@/components/admin/AdminDashboardView";

export const metadata: Metadata = {
  title: "Dashboard — D'Fluer Admin",
  description: "Admin home dashboard for D Fleur",
};

export default function Page() {
  return <AdminDashboardView />;
}
