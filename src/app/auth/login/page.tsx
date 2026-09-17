import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Login — D'Fluer",
  description: "Sign in to your D'Fluer account",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
