import type { Metadata } from "next";
import LoginPage from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Login — dFleur",
  description: "Sign in to your dFleur account",
};

export default function Page() {
  return <LoginPage />;
}
