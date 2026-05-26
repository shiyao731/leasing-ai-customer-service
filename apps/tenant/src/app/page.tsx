"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
}

interface ActionInfo {
  type: string;
  params: Record<string, string>;
}

interface TenantInfo {
  id: string;
  name: string;
  roomNo: string;
  phone: string;
  billStatus: string;
  overdueDays: number;
  totalDue: number;
}

export default function TenantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好呀～我是阳光公寓的AI管家小矩！😊\n有什么可以帮你的吗？问WiFi、报修、查账单都可以找我哦～",
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: text,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          tenantId: tenant?.id,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "抱歉，我这边出了点小问题，请稍后再试～",
            time: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            time: new Date().toISOString(),
          },
        ]);

        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        if (data.tenant) {
          setTenant(data.tenant);
        }

        // Handle action
        if (data.action) {
          handleAction(data.action);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "网络好像不太稳定，请稍后再试～",
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleAction(action: ActionInfo) {
    switch (action.type) {
      case "VERIFY_REQUIRED":
        setShowVerify(true);
        break;
    }
  }

  async function handleVerify() {
    if (!verifyPhone.trim()) return;
    setVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: verifyPhone }),
      });
      const data = await res.json();

      if (data.verified) {
        setTenant(data.tenant);
        setShowVerify(false);
        setVerifyPhone("");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            time: new Date().toISOString(),
          },
        ]);
      } else {
        setVerifyError(data.message || "验证失败");
      }
    } catch {
      setVerifyError("网络异常，请重试");
    } finally {
      setVerifying(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100">
      {/* Phone frame */}
      <div className="relative w-full max-w-md h-screen md:h-[90vh] md:max-h-[800px] bg-[#faf7f2] shadow-2xl md:rounded-3xl overflow-hidden flex flex-col border border-stone-200/50">
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-amber-50 to-[#faf7f2] border-b border-amber-100/50">
          {/* Back button */}
          <button className="text-amber-700 hover:text-amber-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              小矩
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#faf7f2]" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-stone-800 tracking-wide">
              AI管家 · 小矩
            </h1>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              在线 · 秒回复
            </p>
          </div>

          {/* More button */}
          <button className="text-amber-600 hover:text-amber-800 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </header>

        {/* Tenant info bar */}
        {tenant && (
          <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 bg-white/80 backdrop-blur rounded-xl border border-amber-200/60 shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">
              {tenant.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-stone-700">
                {tenant.name} · {tenant.roomNo}
              </p>
              <p className="text-[11px] text-stone-400">
                {tenant.billStatus === "overdue"
                  ? `逾期${tenant.overdueDays}天 · ¥${tenant.totalDue}`
                  : "账单正常"}
              </p>
            </div>
            <button
              onClick={() => setTenant(null)}
              className="text-stone-300 hover:text-stone-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* AI avatar */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    小矩
                  </div>
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-[75%] group ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`relative px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl rounded-tr-md shadow-sm"
                      : "bg-white text-stone-700 rounded-2xl rounded-tl-md shadow-sm border border-stone-100/80"
                  }`}
                >
                  {/* Bubble tail */}
                  <div
                    className={`absolute top-0 ${
                      msg.role === "user"
                        ? "-right-1 w-3 h-3 bg-amber-400"
                        : "-left-1 w-3 h-3 bg-white"
                    }`}
                    style={{
                      clipPath: msg.role === "user"
                        ? "polygon(0 0, 100% 100%, 100% 0)"
                        : "polygon(100% 0, 0 100%, 0 0)",
                    }}
                  />
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <p
                  className={`text-[10px] text-stone-300 mt-0.5 ${
                    msg.role === "user" ? "text-right mr-1" : "ml-1"
                  }`}
                >
                  {formatTime(msg.time)}
                </p>
              </div>

              {/* User avatar placeholder */}
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px] font-bold">
                    我
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  小矩
                </div>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md shadow-sm border border-stone-100/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="relative z-10 px-4 pb-2 flex flex-wrap gap-2">
            {["WiFi密码多少？", "空调不制冷", "快递在哪取？", "我想找管家"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="text-[12px] px-3 py-1.5 bg-white/80 border border-stone-200/60 rounded-full text-stone-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all disabled:opacity-50"
                >
                  {s}
                </button>
              )
            )}
          </div>
        )}

        {/* Input bar */}
        <div className="relative z-10 px-3 py-3 bg-white/60 backdrop-blur border-t border-stone-200/50">
          <div className="flex items-end gap-2">
            {/* Emoji button */}
            <button className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-stone-400 hover:text-amber-500 transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>

            {/* Input */}
            <div className="flex-1 bg-stone-50 rounded-2xl border border-stone-200/60 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={loading}
                className="w-full bg-transparent px-4 py-2.5 text-[14px] text-stone-700 placeholder-stone-300 outline-none disabled:opacity-50"
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Verification Modal */}
        {showVerify && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="mx-4 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-in zoom-in-95 duration-300">
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-amber-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>

              <h3 className="text-[16px] font-semibold text-stone-800 text-center mb-1">
                身份验证
              </h3>
              <p className="text-[13px] text-stone-400 text-center mb-5">
                请输入您的手机号，验证身份后即可查询个人信息
              </p>

              <input
                type="tel"
                value={verifyPhone}
                onChange={(e) => {
                  setVerifyPhone(e.target.value);
                  setVerifyError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
                placeholder="请输入手机号"
                maxLength={11}
                className="w-full px-4 py-3 text-[15px] bg-stone-50 border border-stone-200 rounded-xl text-stone-700 placeholder-stone-300 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all mb-1 text-center tracking-wider"
                autoFocus
              />

              {verifyError && (
                <p className="text-[12px] text-red-400 text-center mb-2">
                  {verifyError}
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowVerify(false);
                    setVerifyPhone("");
                    setVerifyError("");
                  }}
                  className="flex-1 py-2.5 text-[14px] text-stone-400 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verifying || !verifyPhone.trim()}
                  className="flex-1 py-2.5 text-[14px] font-medium text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl hover:shadow-md disabled:opacity-30 transition-all"
                >
                  {verifying ? "验证中..." : "确认验证"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
