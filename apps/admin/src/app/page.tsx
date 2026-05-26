"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  conversations: { total: number; resolved: number; handoff: number; rate: number };
  orders: { pending: number; inProgress: number; completed: number };
  collections: { pending: number; reminded: number; severe: number };
  faqCount: number;
  handoffs: { id: string; tenantName: string; messages: string; handoffAt: string; createdAt: string }[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-stone-300 py-20 text-center">加载中...</div>;

  const cards = [
    { label: "总对话数", value: data.conversations.total, sub: "次", color: "from-amber-50 to-orange-50 border-amber-200/60", icon: "💬", iconBg: "bg-amber-100" },
    { label: "AI解决率", value: `${data.conversations.rate}%`, sub: `${data.conversations.resolved}次解决`, color: "from-emerald-50 to-teal-50 border-emerald-200/60", icon: "✓", iconBg: "bg-emerald-100" },
    { label: "转人工数", value: data.conversations.handoff, sub: "次", color: "from-rose-50 to-pink-50 border-rose-200/60", icon: "↗", iconBg: "bg-rose-100" },
    { label: "FAQ条目", value: data.faqCount, sub: "条", color: "from-violet-50 to-purple-50 border-violet-200/60", icon: "📋", iconBg: "bg-violet-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold text-stone-800">仪表盘</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={`animate-in stagger-${i + 1} card-hover bg-gradient-to-br ${c.color} border rounded-2xl p-5`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-stone-400 font-medium tracking-wide">{c.label}</p>
              <span className={`w-8 h-8 ${c.iconBg} rounded-xl flex items-center justify-center text-sm`}>{c.icon}</span>
            </div>
            <p className="font-display text-3xl font-bold text-stone-800 tracking-tight">{c.value}</p>
            <p className="text-xs text-stone-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Handoff requests (shown first if any) */}
      {data.handoffs.length > 0 && (
        <div className="animate-in stagger-2 bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-stone-700">
              转接请求 ({data.handoffs.length}个待处理)
            </h3>
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
          </div>
          <div className="space-y-3">
            {data.handoffs.map((h) => {
              const msgs = JSON.parse(h.messages || "[]");
              const lastMsg = msgs[msgs.length - 1]?.content?.slice(0, 100) || "";
              return (
                <div key={h.id} className="flex items-start gap-4 p-4 bg-rose-50/50 border border-rose-100/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-sm font-bold flex-shrink-0">
                    {h.tenantName[0] || "访"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-stone-700">{h.tenantName}</span>
                      <span className="text-xs text-stone-400">
                        {new Date(h.handoffAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 line-clamp-2">{lastMsg}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-rose-50 text-rose-500 rounded-lg flex-shrink-0">
                    待处理
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders & Collections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Work orders */}
        <div className="animate-in stagger-3 bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h3 className="font-display text-base font-semibold text-stone-700 mb-4">工单状态</h3>
          <div className="space-y-4">
            {[
              { label: "待处理", count: data.orders.pending, pct: data.orders.pending / Math.max(data.orders.pending + data.orders.inProgress + data.orders.completed, 1) * 100, color: "bg-amber-400" },
              { label: "进行中", count: data.orders.inProgress, pct: data.orders.inProgress / Math.max(data.orders.pending + data.orders.inProgress + data.orders.completed, 1) * 100, color: "bg-blue-400" },
              { label: "已完成", count: data.orders.completed, pct: data.orders.completed / Math.max(data.orders.pending + data.orders.inProgress + data.orders.completed, 1) * 100, color: "bg-emerald-400" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-stone-500">{s.label}</span>
                  <span className="font-display font-semibold text-stone-700">{s.count}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="animate-in stagger-4 bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
          <h3 className="font-display text-base font-semibold text-stone-700 mb-4">催租概况</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "待催收", count: data.collections.pending, color: "text-amber-500" },
              { label: "已提醒", count: data.collections.reminded, color: "text-blue-500" },
              { label: "严重逾期", count: data.collections.severe, color: "text-rose-500" },
            ].map((c) => (
              <div key={c.label} className="text-center p-3 bg-stone-50 rounded-xl">
                <p className={`font-display text-2xl font-bold ${c.color}`}>{c.count}</p>
                <p className="text-xs text-stone-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>
          {data.collections.severe > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-600">
              有 {data.collections.severe} 名租客逾期超过7天，建议管家介入
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
