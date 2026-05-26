import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "阳光公寓 · AI智能管家",
  description: "24小时AI管家，随时为您服务",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
