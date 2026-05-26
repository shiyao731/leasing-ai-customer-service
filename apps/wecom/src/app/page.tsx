"use client";

import { useEffect, useState, useRef } from "react";

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
  messages?: string; // JSON array of {role, content, time}
}

interface Manager {
  id: string;
  name: string;
  phone: string;
  isOnDuty: boolean;
}

const WECOM_GREEN = "#07C160";

export default function WecomPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [currentManager, setCurrentManager] = useState<string>("");
  const [tab, setTab] = useState<"mine" | "group">("mine");
  const [chatWith, setChatWith] = useState<string | null>(null); // handoff ID to chat with
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<{ role: string; content: string; time: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = () => {
    fetch("/api/handoffs")
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

  // Poll for new handoffs
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll chat messages when chatting
  useEffect(() => {
    if (!chatWith) return;
    const interval = setInterval(() => {
      fetch(`/api/handoffs/${chatWith}/messages`)
        .then((r) => r.json())
        .then((data) => setChatMsgs(data.messages || []));
    }, 2000);
    return () => clearInterval(interval);
  }, [chatWith]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  async function claim(id: string) {
    await fetch(`/api/handoffs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "claimed", claimedBy: currentManager }),
    });
    load();
  }

  async function startChat(id: string) {
    setChatWith(id);
    // Load initial messages
    const res = await fetch(`/api/handoffs/${id}/messages`);
    const data = await res.json();
    setChatMsgs(data.messages || []);
  }

  async function sendMessage() {
    if (!chatInput.trim() || !chatWith) return;
    await fetch(`/api/handoffs/${chatWith}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "manager", content: chatInput, sender: currentManager }),
    });
    setChatInput("");
    // Refresh
    const res = await fetch(`/api/handoffs/${chatWith}/messages`);
    const data = await res.json();
    setChatMsgs(data.messages || []);
  }

  async function close(id: string) {
    await fetch(`/api/handoffs/${id}`, {
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

  const claimedList = handoffs.filter((h) => h.status === "claimed" && h.claimedBy === currentManager);

  // Chat view
  if (chatWith) {
    const h = handoffs.find((x) => x.id === chatWith);
    return (
      <div className="flex flex-col h-screen bg-[#ededed] max-w-md mx-auto">
        {/* Chat header */}
        <div style={{ backgroundColor: WECOM_GREEN }} className="text-white px-4 py-3 flex items-center gap-3">
          <button onClick={() => setChatWith(null)} className="text-white/80">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium">{h?.tenantName} · {h?.roomNo}</p>
            <p className="text-[11px] text-white/70">人工客服对话中</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#ededed]">
          {chatMsgs.length === 0 && (
            <div className="text-center py-10 text-stone-400 text-sm">暂无消息，发送第一条消息吧</div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "manager" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  m.role === "manager"
                    ? "text-white rounded-tr-sm"
                    : "bg-white text-stone-700 rounded-tl-sm shadow-sm"
                }`}
                style={m.role === "manager" ? { backgroundColor: WECOM_GREEN } : {}}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-0.5 ${m.role === "manager" ? "text-white/60" : "text-stone-300"}`}>
                  {new Date(m.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-stone-200 px-3 py-3 flex items-center gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!chatInput.trim()}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-30"
            style={{ backgroundColor: WECOM_GREEN }}
          >
            发送
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-md mx-auto h-screen bg-[#ededed] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-stone-800">消息中心</h2>
          <span className="text-[11px] text-stone-400">企业微信 · 模拟</span>
        </div>
        <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2">
          <span className="text-xs text-stone-400">当前管家</span>
          <select
            value={currentManager}
            onChange={(e) => setCurrentManager(e.target.value)}
            className="text-sm font-medium text-stone-700 bg-transparent outline-none flex-1 cursor-pointer"
          >
            {managers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} {m.isOnDuty ? "值班中" : "离线"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-stone-100">
        {[
          { key: "mine" as const, label: "指派给我" },
          { key: "group" as const, label: "群聊待认领" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-3 text-sm font-medium relative transition-colors"
            style={{ color: tab === t.key ? WECOM_GREEN : "#a8a29e" }}
          >
            {t.label}
            {tab === t.key && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ backgroundColor: WECOM_GREEN }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filtered.length === 0 && claimedList.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-stone-300" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="text-sm text-stone-300">暂无待处理转接</p>
          </div>
        ) : (
          <>
            {filtered.map((h) => (
              <div key={h.id} className="bg-white rounded-xl p-4 space-y-3 shadow-sm animate-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: WECOM_GREEN }}>
                    {h.tenantName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-800">{h.tenantName}</span>
                      <span className="text-xs text-stone-400">{h.roomNo}</span>
                    </div>
                    <p className="text-[11px] text-stone-400">{new Date(h.createdAt).toLocaleString("zh-CN")}</p>
                  </div>
                  {h.assignee && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ color: WECOM_GREEN, borderColor: `${WECOM_GREEN}40`, backgroundColor: `${WECOM_GREEN}08` }}>
                      @{h.assignee}
                    </span>
                  )}
                </div>
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-xs text-stone-500 leading-relaxed">📋 {h.summary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => claim(h.id)}
                    className="flex-1 py-2 text-sm font-medium text-white rounded-lg active:scale-95 transition-all"
                    style={{ backgroundColor: WECOM_GREEN }}
                  >
                    认领
                  </button>
                  <button onClick={() => close(h.id)} className="px-4 py-2 text-sm text-stone-400 bg-stone-100 rounded-lg">
                    忽略
                  </button>
                </div>
              </div>
            ))}

            {/* Claimed conversations */}
            {claimedList.map((h) => (
              <div key={h.id} className="bg-white rounded-xl p-4 space-y-3 shadow-sm border-l-4" style={{ borderLeftColor: WECOM_GREEN }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-800">{h.tenantName}</span>
                    <span className="text-xs text-stone-400">{h.roomNo}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: WECOM_GREEN }}>
                    已认领
                  </span>
                </div>
                <p className="text-xs text-stone-500">📋 {h.summary}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => startChat(h.id)}
                    className="flex-1 py-2 text-sm font-medium text-white rounded-lg active:scale-95 transition-all"
                    style={{ backgroundColor: WECOM_GREEN }}
                  >
                    回复消息
                  </button>
                  <button onClick={() => close(h.id)} className="px-4 py-2 text-sm text-stone-400 bg-stone-100 rounded-lg">
                    关闭
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
