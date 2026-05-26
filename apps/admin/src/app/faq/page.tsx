"use client";

import { useEffect, useState } from "react";

const categoryLabels: Record<string, string> = {
  "入门指南": "入门指南", "快递": "快递", "公共设施": "公共设施",
  "停车": "停车", "报修": "报修", "账单": "账单",
  "续租": "续租", "居住证": "居住证", "投诉": "投诉", "看房": "看房",
};

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ category: "入门指南", question: "", answer: "", keywords: "" });

  const load = () => fetch("/api/admin/faq").then((r) => r.json()).then(setFaqs);
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.question || !form.answer) return;
    if (editing) {
      await fetch("/api/admin/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing.id }),
      });
    } else {
      await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setEditing(null);
    setAdding(false);
    setForm({ category: "入门指南", question: "", answer: "", keywords: "" });
    load();
  }

  async function del(id: string) {
    await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
    load();
  }

  // Group by category
  const grouped: Record<string, any[]> = {};
  faqs.forEach((f) => {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">FAQ 知识库</h2>
        <button
          onClick={() => { setAdding(true); setEditing(null); setForm({ category: "入门指南", question: "", answer: "", keywords: "" }); }}
          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors"
        >
          + 添加FAQ
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-stone-400 uppercase tracking-wider">
            {categoryLabels[cat] || cat}
          </h3>
          <div className="grid gap-3">
            {items.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 mb-1">Q: {f.question}</p>
                  <p className="text-sm text-stone-400">A: {f.answer}</p>
                  <p className="text-xs text-stone-300 mt-2">关键词: {f.keywords || "无"}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(f); setForm({ category: f.category, question: f.question, answer: f.answer, keywords: f.keywords }); }}
                    className="text-xs px-3 py-1.5 text-stone-500 bg-stone-50 rounded-lg hover:bg-stone-100"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => del(f.id)}
                    className="text-xs px-3 py-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit/Add Modal */}
      {(editing || adding) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">
              {editing ? "编辑FAQ" : "添加FAQ"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                >
                  {Object.keys(categoryLabels).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">问题</label>
                <input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">答案</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">关键词 (逗号分隔)</label>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setEditing(null); setAdding(false); }}
                className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl"
              >
                取消
              </button>
              <button
                onClick={save}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600"
              >
                {editing ? "保存" : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
