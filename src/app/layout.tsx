import type { Metadata, Viewport } from "next";
import "./globals.css";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";

export const metadata: Metadata = {
  title: "Matching Wealth Co., Ltd.",
  description: "Project Handover & HR Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">
        <InAppBrowserGuard />
        {children}
      </body>
    </html>
  );
}
