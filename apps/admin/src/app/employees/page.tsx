"use client";

import { useEffect, useState } from "react";

const specialtyLabels: Record<string, string> = {
  appliance: "家电维修", plumbing: "水电维修", doorlock: "门锁/家具", other: "其他",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<"manager" | "staff">("manager");
  const [form, setForm] = useState({ name: "", phone: "", isOnDuty: true, specialty: "other" });

  const load = async () => {
    const [mgrs, stf] = await Promise.all([
      fetch("/api/admin/managers").then(r => r.json()),
      fetch("/api/admin/staff").then(r => r.json()),
    ]);
    const all = [
      ...mgrs.map((m: any) => ({ ...m, role: "manager" as const })),
      ...stf.map((s: any) => ({ ...s, role: "staff" as const })),
    ];
    setEmployees(all);
  };

  useEffect(() => { load(); }, []);

  function openAdd(role: "manager" | "staff") {
    setEditId(null); setEditRole(role);
    setForm({ name: "", phone: "", isOnDuty: true, specialty: "other" });
    setShowForm(true);
  }

  function openEdit(emp: any) {
    setEditId(emp.id); setEditRole(emp.role);
    setForm({ name: emp.name, phone: emp.phone, isOnDuty: emp.isOnDuty ?? true, specialty: emp.specialty || "other" });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.phone) return;
    if (editRole === "manager") {
      const body: any = { name: form.name, phone: form.phone, isOnDuty: form.isOnDuty };
      if (editId) {
        await fetch(`/api/admin/managers/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/admin/managers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
    } else {
      const body = { name: form.name, phone: form.phone, specialty: form.specialty };
      if (editId) {
        await fetch(`/api/admin/staff-crud/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
    }
    setShowForm(false); load();
  }

  async function del(emp: any) {
    const endpoint = emp.role === "manager" ? `/api/admin/managers/${emp.id}` : `/api/admin/staff-crud/${emp.id}`;
    await fetch(endpoint, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">员工管理</h2>
        <div className="flex gap-2">
          <button onClick={() => openAdd("manager")} className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors">+ 添加管家</button>
          <button onClick={() => openAdd("staff")} className="px-4 py-2 bg-stone-600 text-white text-sm rounded-xl hover:bg-stone-700 transition-colors">+ 添加工人</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        {employees.length === 0 ? (
          <p className="text-stone-300 text-sm py-12 text-center">暂无员工数据</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">姓名</th>
                <th className="text-left px-5 py-3 font-medium">职位</th>
                <th className="text-left px-5 py-3 font-medium">手机</th>
                <th className="text-left px-5 py-3 font-medium">状态/领域</th>
                <th className="text-right px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={`${e.role}-${e.id}`} className="border-b border-stone-50">
                  <td className="px-5 py-3 text-stone-700 font-medium">{e.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      e.role === "manager" ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-500"
                    }`}>
                      {e.role === "manager" ? "管家" : "维修师傅"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-500 font-mono text-xs">{e.phone}</td>
                  <td className="px-5 py-3">
                    {e.role === "manager" ? (
                      <span className={`text-xs px-2 py-1 rounded-lg ${e.isOnDuty ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"}`}>
                        {e.isOnDuty ? "值班中" : "离线"}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-stone-50 rounded-lg text-stone-500">
                        {specialtyLabels[e.specialty] || e.specialty}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="text-xs px-3 py-1.5 text-stone-500 bg-stone-50 rounded-lg hover:bg-stone-100">编辑</button>
                      <button onClick={() => del(e)} className="text-xs px-3 py-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100">删除</button>
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
              {editId ? "编辑员工" : `添加${editRole === "manager" ? "管家" : "维修师傅"}`}
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
              {editRole === "manager" ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400">值班状态</span>
                  <button onClick={() => setForm({ ...form, isOnDuty: !form.isOnDuty })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isOnDuty ? "bg-emerald-500" : "bg-stone-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isOnDuty ? "translate-x-5" : ""}`} />
                  </button>
                  <span className="text-xs text-stone-400">{form.isOnDuty ? "值班中" : "离线"}</span>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">擅长领域</label>
                  <select value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300">
                    {Object.entries(specialtyLabels).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
              )}
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
