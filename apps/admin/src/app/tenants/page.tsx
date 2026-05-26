"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", roomNo: "", phone: "", leaseStart: "", leaseEnd: "", monthlyRent: 0, managerId: "" });
  const router = useRouter();

  const load = () => fetch("/api/admin/tenants").then((r) => r.json()).then(setTenants);
  const loadManagers = () => fetch("/api/admin/tenants?type=managers").then((r) => r.json()).then(setManagers);
  useEffect(() => { load(); }, []);
  useEffect(() => { fetch("/api/admin/settings").then(r => r.json()); }, []);

  async function addTenant() {
    await fetch("/api/admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ name: "", roomNo: "", phone: "", leaseStart: "", leaseEnd: "", monthlyRent: 0, managerId: "" });
    load();
  }

  // Load managers for the add form
  useEffect(() => {
    // Directly fetch managers from core via admin API
    fetch("/api/admin/handoffs").then(r => r.json()).then(d => setManagers(d.managers || []));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">租客管理</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-amber-500 text-white text-sm rounded-xl hover:bg-amber-600 transition-colors"
        >
          + 添加租客
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">姓名</th>
                <th className="text-left px-5 py-3 font-medium">房号</th>
                <th className="text-left px-5 py-3 font-medium">手机</th>
                <th className="text-left px-5 py-3 font-medium">租期</th>
                <th className="text-left px-5 py-3 font-medium">月租</th>
                <th className="text-left px-5 py-3 font-medium">账单</th>
                <th className="text-left px-5 py-3 font-medium">激活</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/tenants/${t.id}`)}
                  className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 text-stone-700 font-medium">{t.name}</td>
                  <td className="px-5 py-3 text-stone-500">{t.roomNo}</td>
                  <td className="px-5 py-3 text-stone-500 font-mono text-xs">{t.phone}</td>
                  <td className="px-5 py-3 text-xs text-stone-400">
                    {new Date(t.leaseStart).toLocaleDateString("zh-CN")} ~ {new Date(t.leaseEnd).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-5 py-3 text-stone-600">¥{t.monthlyRent}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      t.billStatus === "overdue" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {t.billStatus === "overdue" ? `逾期${t.overdueDays}天` : "正常"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      t.activated ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
                    }`}>
                      {t.activated ? "已激活" : "未激活"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">添加租客</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "姓名", key: "name", type: "text" },
                { label: "房号", key: "roomNo", type: "text" },
                { label: "手机号", key: "phone", type: "tel" },
                { label: "月租金", key: "monthlyRent", type: "number" },
              ].map((f) => (
                <div key={f.key} className={f.key === "name" || f.key === "phone" ? "col-span-2" : ""}>
                  <label className="text-xs text-stone-400 mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-stone-400 mb-1 block">分配管家</label>
                <select
                  value={form.managerId}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">暂不分配</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.isOnDuty ? "(值班中)" : "(离线)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">租期开始</label>
                <input
                  type="date"
                  value={form.leaseStart}
                  onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">租期结束</label>
                <input
                  type="date"
                  value={form.leaseEnd}
                  onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl">
                取消
              </button>
              <button onClick={addTenant} className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
