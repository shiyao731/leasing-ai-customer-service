import type { Metadata } from "next";
import "./globals.css";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = {
  title: "阳光公寓 · 管家后台",
  description: "AI智能客服管理后台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
