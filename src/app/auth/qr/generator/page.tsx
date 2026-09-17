import type { Metadata } from "next";
import { QrGeneratorView } from "@/components/auth/QrGeneratorView";

export const metadata: Metadata = {
  title: "Thiết lập xác thực 2 lớp — dFleur",
  description: "Quét mã QR để thiết lập xác thực hai lớp",
};

export default function Page() {
  return <QrGeneratorView />;
}
