import type { Metadata } from "next";
import { QrVerifyView } from "@/components/auth/QrVerifyView";

export const metadata: Metadata = {
  title: "Xác thực 2 lớp — dFleur",
  description: "Nhập mã OTP từ ứng dụng xác thực để hoàn tất đăng nhập",
};

export default function Page() {
  return <QrVerifyView />;
}
