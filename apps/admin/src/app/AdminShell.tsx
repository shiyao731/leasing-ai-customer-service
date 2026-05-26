"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "仪表盘", icon: "◉" },
  { href: "/orders", label: "工单管理", icon: "☰" },
  { href: "/tenants", label: "租客管理", icon: "◆" },
  { href: "/collection", label: "催租管理", icon: "◇" },
  { href: "/faq", label: "FAQ编辑", icon: "▣" },
  { href: "/settings", label: "设置", icon: "◎" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-stone-50 min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-30 h-screen w-60 bg-white border-r border-stone-200 flex flex-col sidebar-transition ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-stone-100">
          <h1 className="font-display text-lg font-bold text-stone-800 tracking-tight">
            阳光公寓
          </h1>
          <p className="text-xs text-stone-400 mt-0.5 tracking-wide">管家后台</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className={`text-base ${active ? "text-amber-500" : "text-stone-300"}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100">
          <p className="text-[11px] text-stone-300">矩阵智能 · AI智能客服 v1.0-MVP</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
          <button
            className="lg:hidden text-stone-500 hover:text-stone-700 p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">
              管
            </div>
            <span className="text-sm text-stone-600 font-medium hidden sm:inline">管家</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
