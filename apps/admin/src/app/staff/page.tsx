"use client";

import { useEffect, useState } from "react";

const specialtyLabels: Record<string, string> = {
  appliance: "家电维修",
  plumbing: "水电维修",
  doorlock: "门锁/家具",
  other: "其他",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", specialty: "other" });

  const load = () => fetch("/api/admin/staff").then((r) => r.json()).then(setStaff);
  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm({ name: "", phone: "", specialty: "other" });
    setShowForm(true);
  }

  function openEdit(s: any) {
    setEditId(s.id);
    setForm({ name: s.name, phone: s.phone, specialty: s.specialty });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.phone) return;
    if (editId) {
      await fetch(`/api/admin/staff-crud/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setShowForm(false);
    load();
  }

  async function del(id: string) {
    await fetch(`/api/admin/staff-crud/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">维修师傅管理</h2>
        <button onClick={openAdd} className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors">
          + 添加工人
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        {staff.length === 0 ? (
          <p className="text-stone-300 text-sm py-12 text-center">暂无维修师傅数据</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">姓名</th>
                <th className="text-left px-5 py-3 font-medium">手机</th>
                <th className="text-left px-5 py-3 font-medium">擅长领域</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b border-stone-50">
                  <td className="px-5 py-3 text-stone-700 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-stone-500 font-mono text-xs">{s.phone}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 bg-stone-50 rounded-lg text-stone-500">
                      {specialtyLabels[s.specialty] || s.specialty}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(s)} className="text-xs px-3 py-1.5 text-stone-500 bg-stone-50 rounded-lg hover:bg-stone-100">编辑</button>
                      <button onClick={() => del(s.id)} className="text-xs px-3 py-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">
              {editId ? "编辑师傅" : "添加工人"}
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
              <div>
                <label className="text-xs text-stone-400 mb-1 block">擅长领域</label>
                <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300">
                  {Object.entries(specialtyLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
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
