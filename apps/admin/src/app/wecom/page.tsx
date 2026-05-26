"use client";

import { useEffect, useState } from "react";

interface Handoff {
  id: string;
  tenantName: string;
  roomNo: string;
  phone: string;
  summary: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  claimedAt: string | null;
  claimedBy: string | null;
}

interface Manager {
  id: string;
  name: string;
  phone: string;
  isOnDuty: boolean;
}

export default function WecomPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [currentManager, setCurrentManager] = useState<string>("");
  const [tab, setTab] = useState<"mine" | "group">("mine");

  const load = () => {
    fetch("/api/admin/handoffs")
      .then((r) => r.json())
      .then((data) => {
        setHandoffs(data.handoffs);
        setManagers(data.managers);
        if (!currentManager && data.managers.length > 0) {
          setCurrentManager(data.managers[0].name);
        }
      });
  };

  useEffect(() => { load(); }, []);

  async function claim(id: string) {
    await fetch(`/api/admin/handoffs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "claimed",
        claimedBy: currentManager,
      }),
    });
    load();
  }

  async function close(id: string) {
    await fetch(`/api/admin/handoffs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    load();
  }

  const filtered = handoffs.filter((h) => {
    if (tab === "mine") return h.assignee === currentManager && h.status === "assigned";
    return h.status === "pending";
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-800">消息中心</h2>
          <p className="text-xs text-stone-400 mt-1">企业微信 · 模拟端</p>
        </div>
        <div className="flex items-center gap-2 bg-wecom-green/5 border border-wecom-green/20 rounded-xl px-3 py-2">
          <span className="text-xs text-stone-400">当前管家</span>
          <select
            value={currentManager}
            onChange={(e) => setCurrentManager(e.target.value)}
            className="text-sm font-medium text-stone-700 bg-transparent outline-none cursor-pointer"
          >
            {managers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} {m.isOnDuty ? "🟢" : "🔴"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Phone frame */}
      <div className="bg-[#ededed] rounded-3xl p-4 shadow-lg border-4 border-stone-800 max-w-sm mx-auto">
        {/* WeCom status bar */}
        <div className="bg-[#ededed] rounded-t-2xl pb-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-stone-800 font-medium">9:41</span>
            <div className="flex gap-1">
              <span className="text-[10px]">●●●●○</span>
              <span className="text-[10px]">WiFi</span>
              <span className="text-[10px]">🔋</span>
            </div>
          </div>
          <p className="text-sm font-bold text-stone-800 text-center mt-2">消息中心</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl min-h-[400px]">
          {/* Tabs */}
          <div className="flex border-b border-stone-100">
            {[
              { key: "mine" as const, label: "指派给我" },
              { key: "group" as const, label: "群聊待认领" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                  tab === t.key ? "text-wecom-green" : "text-stone-400"
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-wecom-green rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 bg-stone-100 rounded-2xl flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-stone-300" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="text-sm text-stone-300">暂无待处理转接</p>
              </div>
            ) : (
              filtered.map((h) => (
                <div
                  key={h.id}
                  className="bg-[#f8f8f8] rounded-xl p-4 space-y-3 border border-stone-100 animate-in"
                >
                  {/* Tenant info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-wecom-green/10 flex items-center justify-center text-wecom-green text-sm font-bold flex-shrink-0">
                      {h.tenantName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800">{h.tenantName}</span>
                        <span className="text-xs text-stone-400">{h.roomNo}</span>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        {new Date(h.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {h.assignee && (
                      <span className="text-[10px] px-2 py-0.5 bg-wecom-green/5 text-wecom-green rounded-full border border-wecom-green/20">
                        @{h.assignee}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-white rounded-lg p-3 border border-stone-100">
                    <p className="text-xs text-stone-500 leading-relaxed">📋 {h.summary}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => claim(h.id)}
                      className="flex-1 py-2 text-sm font-medium text-white bg-wecom-green rounded-lg hover:bg-wecom-green/90 transition-all active:scale-95"
                    >
                      认领
                    </button>
                    <button
                      onClick={() => close(h.id)}
                      className="px-4 py-2 text-sm text-stone-400 bg-stone-100 rounded-lg hover:bg-stone-200 transition-all"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom nav bar */}
          <div className="flex border-t border-stone-100 py-2">
            {["消息", "通讯录", "工作台", "我"].map((item) => (
              <div key={item} className="flex-1 text-center">
                <span className={`text-[10px] ${item === "消息" ? "text-wecom-green font-medium" : "text-stone-400"}`}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WeCom green styles */}
      <style jsx global>{`
        .bg-wecom-green { background-color: #07C160; }
        .text-wecom-green { color: #07C160; }
        .border-wecom-green\\/20 { border-color: rgba(7, 193, 96, 0.2); }
        .bg-wecom-green\\/5 { background-color: rgba(7, 193, 96, 0.05); }
        .bg-wecom-green\\/10 { background-color: rgba(7, 193, 96, 0.1); }
        .hover\\:bg-wecom-green\\/90:hover { background-color: rgba(7, 193, 96, 0.9); }
      `}</style>
    </div>
  );
}
