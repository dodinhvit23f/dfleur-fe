import type { Metadata } from "next";
import { LogoutView } from "@/components/auth/LogoutView";

export const metadata: Metadata = {
  title: "Đăng xuất — D'Fluer",
};

export default function Page() {
  return <LogoutView />;
}
