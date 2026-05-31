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
  // Auth state: null = not yet verified, TenantInfo = verified, "guest" = skipped
  const [tenant, setTenant] = useState<TenantInfo | null | "guest">(null);
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [handoffId, setHandoffId] = useState<string | null>(null);

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Init chat after verification
  useEffect(() => {
    if (tenant && tenant !== "guest" && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `已确认～${tenant.name}您好，欢迎回来！😊\n有什么可以帮您的吗？`,
          time: new Date().toISOString(),
        },
      ]);
    } else if (tenant === "guest" && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "你好呀～我是阳光公寓的AI管家小矩！😊\n有什么可以帮你的吗？问WiFi、报修都可以找我哦～\n\n💡 提示：输入手机号验证身份后可以查询账单等个人信息",
          time: new Date().toISOString(),
        },
      ]);
    }
  }, [tenant, messages.length]);

  // Track shown message timestamps to prevent duplicates
  const shownMsgTimes = useRef(new Set<string>());

  // Poll for manager messages when in handoff bridge mode
  useEffect(() => {
    if (!handoffId) return;
    shownMsgTimes.current = new Set(); // Reset on new handoff
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/handoffs/${handoffId}/messages`);
        const data = await res.json();
        const msgs: { role: string; content: string; sender?: string; time: string }[] = data.messages || [];
        // Show only new manager messages not yet displayed
        for (const m of msgs) {
          if (m.role === "manager" && !shownMsgTimes.current.has(m.time)) {
            shownMsgTimes.current.add(m.time);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `【管家${m.sender || ""}】${m.content}`,
                time: m.time,
              },
            ]);
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [handoffId]);

  // Focus input
  useEffect(() => {
    if (tenant) {
      inputRef.current?.focus();
    } else {
      phoneRef.current?.focus();
    }
  }, [tenant]);

  async function handleVerify() {
    if (!phone.trim() || phone.length < 11) {
      setVerifyError("请输入正确的11位手机号");
      return;
    }
    setVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.verified) {
        setTenant(data.tenant);
      } else {
        setVerifyError(data.message || "未找到该手机号，请联系管家登记");
      }
    } catch {
      setVerifyError("网络异常，请重试");
    } finally {
      setVerifying(false);
    }
  }

  async function uploadImages(files: File[]): Promise<string[]> {
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      return data.paths || [];
    } catch {
      return [];
    } finally {
      setUploading(false);
      setUploadedImages([]);
    }
  }

  async function sendMessage(text: string, imagePaths?: string[]) {
    if (!text.trim() && !imagePaths?.length) return;

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
          tenantId: tenant && tenant !== "guest" ? tenant.id : undefined,
          sessionId,
          images: imagePaths || [],
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，我这边出了点小问题，请稍后再试～", time: new Date().toISOString() },
        ]);
      } else {
        // Only add non-empty replies (bridge mode returns empty)
        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, time: new Date().toISOString() },
          ]);
        }
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.tenant) setTenant(data.tenant);
        // Enter manager chat bridge mode
        if (data.action?.params?.handoffId) {
          setHandoffId(data.action.params.handoffId);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络好像不太稳定，请稍后再试～", time: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text && uploadedImages.length === 0) return;
    if (loading || uploading) return;

    let imagePaths: string[] = [];
    if (uploadedImages.length > 0) {
      imagePaths = await uploadImages(uploadedImages);
    }
    sendMessage(text, imagePaths);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // ===== VERIFY SCREEN =====
  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="relative w-full max-w-md h-screen md:h-[90vh] md:max-h-[800px] bg-[#faf7f2] shadow-2xl md:rounded-3xl overflow-hidden flex flex-col border border-stone-200/50">
          {/* Noise texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Header */}
          <header className="relative z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-amber-50 to-[#faf7f2] border-b border-amber-100/50">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                小矩
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#faf7f2]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15px] font-semibold text-stone-800 tracking-wide">AI管家 · 小矩</h1>
              <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                在线 · 秒回复
              </p>
            </div>
          </header>

          {/* Verify form */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-20">
            {/* Logo */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-6">
              小矩
            </div>

            <h2 className="text-xl font-bold text-stone-800 mb-2">欢迎回来</h2>
            <p className="text-sm text-stone-400 text-center mb-8">
              请输入您的手机号进行身份验证<br />
              验证后可使用全部功能
            </p>

            {/* Phone input */}
            <div className="w-full max-w-xs space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-sm">
                  +86
                </div>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setVerifyError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full pl-14 pr-4 py-3.5 text-[16px] tracking-widest bg-white border border-stone-200 rounded-2xl text-stone-700 placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all text-center"
                />
              </div>

              {verifyError && (
                <p className="text-[13px] text-rose-500 text-center">{verifyError}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full py-3.5 text-[15px] font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {verifying ? "验证中..." : "验证身份"}
              </button>

              <button
                onClick={() => setTenant("guest")}
                className="w-full py-2 text-[13px] text-stone-400 hover:text-stone-600 transition-colors"
              >
                跳过，以访客身份使用
              </button>
            </div>

            {/* Footer note */}
            <p className="absolute bottom-8 text-[11px] text-stone-300 text-center">
              未登记的手机号请联系管家录入系统
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== CHAT SCREEN =====
  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100">
      <div className="relative w-full max-w-md h-screen md:h-[90vh] md:max-h-[800px] bg-[#faf7f2] shadow-2xl md:rounded-3xl overflow-hidden flex flex-col border border-stone-200/50">
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-amber-50 to-[#faf7f2] border-b border-amber-100/50">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              小矩
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#faf7f2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-semibold text-stone-800 tracking-wide">AI管家 · 小矩</h1>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              在线 · 秒回复
            </p>
          </div>
        </header>

        {/* Tenant info bar */}
        {tenant && tenant !== "guest" && (
          <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 bg-white/80 backdrop-blur rounded-xl border border-amber-200/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold">
              {tenant.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-stone-700">{tenant.name} · {tenant.roomNo}</p>
              <p className="text-[11px] text-stone-400">
                {tenant.billStatus === "overdue" ? `逾期${tenant.overdueDays}天 · ¥${tenant.totalDue}` : "账单正常"}
              </p>
            </div>
          </div>
        )}

        {tenant === "guest" && (
          <div className="relative z-10 mx-4 mt-3 px-4 py-2.5 bg-amber-50/80 backdrop-blur rounded-xl border border-amber-200/60 flex items-center gap-2">
            <span className="text-[12px] text-amber-600">🔒 访客模式 · 部分功能受限</span>
            <button onClick={() => setTenant(null)} className="ml-auto text-[12px] text-amber-500 underline">去验证</button>
          </div>
        )}

        {/* Messages */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                    小矩
                  </div>
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`relative px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl rounded-tr-md shadow-sm"
                      : "bg-white text-stone-700 rounded-2xl rounded-tl-md shadow-sm border border-stone-100/80"
                  }`}
                >
                  <div
                    className={`absolute top-0 ${msg.role === "user" ? "-right-1 w-3 h-3 bg-amber-400" : "-left-1 w-3 h-3 bg-white"}`}
                    style={{
                      clipPath: msg.role === "user" ? "polygon(0 0, 100% 100%, 100% 0)" : "polygon(100% 0, 0 100%, 0 0)",
                    }}
                  />
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <p className={`text-[10px] text-stone-300 mt-0.5 ${msg.role === "user" ? "text-right mr-1" : "ml-1"}`}>
                  {formatTime(msg.time)}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px] font-bold">我</div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">小矩</div>
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
            {["WiFi密码多少？", "空调不制冷", "快递在哪取？", "我想找管家"].map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="text-[12px] px-3 py-1.5 bg-white/80 border border-stone-200/60 rounded-full text-stone-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Image preview */}
        {uploadedImages.length > 0 && (
          <div className="relative z-10 px-3 pb-1 flex gap-2 overflow-x-auto">
            {uploadedImages.map((file, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-16 h-16 object-cover rounded-lg border border-stone-200"
                />
                <button
                  onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-600 text-white rounded-full text-[10px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="relative z-10 px-3 py-3 bg-white/60 backdrop-blur border-t border-stone-200/50">
          <div className="flex items-end gap-2">
            {/* Camera / image upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-stone-400 hover:text-amber-500 transition-colors disabled:opacity-30"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setUploadedImages(prev => [...prev, ...files]);
                e.target.value = "";
              }}
            />
            <div className="flex-1 bg-stone-50 rounded-2xl border border-stone-200/60 focus-within:border-amber-300 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                disabled={loading || uploading}
                className="w-full bg-transparent px-4 py-2.5 text-[14px] text-stone-700 placeholder-stone-300 outline-none disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedImages.length === 0) || loading || uploading}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
