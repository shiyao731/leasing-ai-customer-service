"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [nightMode, setNightMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setNightMode(data.nightMode));
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
