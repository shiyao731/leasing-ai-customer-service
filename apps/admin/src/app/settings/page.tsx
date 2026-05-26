"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [nightMode, setNightMode] = useState(false);
  const [wecomWebhookUrl, setWecomWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setNightMode(data.nightMode);
        setWecomWebhookUrl(data.wecomWebhookUrl || "");
      });
  }, []);

  async function toggle() {
    const newVal = !nightMode;
    setNightMode(newVal);
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nightMode: newVal }),
    });
    setSaving(false);
  }

  async function saveWebhook() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nightMode, wecomWebhookUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold text-stone-800">设置</h2>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm divide-y divide-stone-100">
        {/* Night mode */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-stone-700">夜间模式</h3>
            <p className="text-xs text-stone-400 mt-1">
              开启后，非紧急报修将在次日处理，紧急事件触发值班通知
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
              nightMode ? "bg-indigo-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${
                nightMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* WeCom Webhook */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-stone-700 mb-2">企业微信通知</h3>
          <p className="text-xs text-stone-400 mb-3">
            填入企微群机器人 Webhook URL，转接请求将实时推送到企微群（Demo阶段通过消息中心模拟）
          </p>
          <div className="flex gap-3">
            <input
              type="url"
              value={wecomWebhookUrl}
              onChange={(e) => setWecomWebhookUrl(e.target.value)}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-wecom-green focus:ring-2 focus:ring-wecom-green/10 transition-all"
            />
            <button
              onClick={saveWebhook}
              disabled={saving}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                saved
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-wecom-green text-white hover:bg-wecom-green/90"
              }`}
            >
              {saved ? "已保存 ✓" : saving ? "..." : "保存"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-stone-700 mb-2">关于</h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            矩阵智能 · AI智能客服 v1.0-MVP<br />
            长租公寓7×24小时AI管家 Demo系统<br />
            基于 DeepSeek + Next.js + Prisma + SQLite 构建
          </p>
        </div>
      </div>
    </div>
  );
}
