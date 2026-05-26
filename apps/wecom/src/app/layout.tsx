import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企业微信 · 消息中心",
  description: "模拟企业微信端转接通知",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
