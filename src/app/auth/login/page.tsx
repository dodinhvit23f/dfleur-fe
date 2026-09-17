import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Login — dFleur",
  description: "Sign in to your dFleur account",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
