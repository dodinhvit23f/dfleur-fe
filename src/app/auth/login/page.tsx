import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Đăng nhập — D'Fluer",
  description: "Đăng nhập vào tài khoản D'Fluer của bạn",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
