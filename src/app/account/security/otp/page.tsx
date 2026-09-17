import type { Metadata } from "next";
import { OtpResetView } from "@/components/account/OtpResetView";

export const metadata: Metadata = {
  title: "Đặt lại xác thực 2 lớp — D'Fluer",
  description: "Tạo lại mã QR và thiết lập ứng dụng xác thực mới",
};

export default function Page() {
  return <OtpResetView />;
}
