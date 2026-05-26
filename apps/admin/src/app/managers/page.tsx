"use client";

import { useEffect, useState } from "react";

export default function ManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", isOnDuty: true });

  const load = () => fetch("/api/admin/managers").then((r) => r.json()).then(setManagers);
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm({ name: "", phone: "", isOnDuty: true });
    setShowForm(true);
  }

  function openEdit(m: any) {
    setEditId(m.id);
    setForm({ name: m.name, phone: m.phone, isOnDuty: m.isOnDuty });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.phone) return;
    if (editId) {
      await fetch(`/api/admin/managers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    await fetch(`/api/admin/managers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">管家管理</h2>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors">
          + 添加管家
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        {managers.length === 0 ? (
          <p className="text-stone-300 text-sm py-12 text-center">暂无管家数据</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">姓名</th>
                <th className="text-left px-5 py-3 font-medium">手机</th>
                <th className="text-left px-5 py-3 font-medium">值班状态</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} className="border-b border-stone-50">
                  <td className="px-5 py-3 text-stone-700 font-medium">{m.name}</td>
                  <td className="px-5 py-3 text-stone-500 font-mono text-xs">{m.phone}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      m.isOnDuty ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
                    }`}>
                      {m.isOnDuty ? "值班中" : "离线"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="text-xs px-3 py-1.5 text-stone-500 bg-stone-50 rounded-lg hover:bg-stone-100">编辑</button>
                      <button onClick={() => del(m.id)} className="text-xs px-3 py-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">
              {editId ? "编辑管家" : "添加管家"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-400 mb-1 block">姓名</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300" />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">手机号</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-stone-400">值班状态</label>
                <button
                  onClick={() => setForm({ ...form, isOnDuty: !form.isOnDuty })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isOnDuty ? "bg-emerald-500" : "bg-stone-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isOnDuty ? "translate-x-5" : ""}`} />
                </button>
                <span className="text-xs text-stone-400">{form.isOnDuty ? "值班中" : "离线"}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl">取消</button>
              <button onClick={save} className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
