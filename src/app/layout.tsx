import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Matching Wealth Co., Ltd.",
  description: "Project Handover & HR Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
