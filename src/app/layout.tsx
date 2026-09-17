import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "D'Fluer",
  description: "D'Fluer — sign in to your account",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <ThemeRegistry
        bodyClassName={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${playfairDisplay.variable}`}
      >
        {children}
      </ThemeRegistry>
    </html>
  );
}
