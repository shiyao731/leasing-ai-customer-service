"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TenantDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => r.json())
      .then(setData);
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    fetch("/api/admin/staff").then(r => r.json()).then(d => {
      // Also need managers - get from handoffs API
      fetch("/api/admin/handoffs").then(r2 => r2.json()).then(d2 => {
        setManagers(d2.managers || []);
      });
    });
  }, []);

  if (!data) return <div className="text-stone-300 py-20 text-center">加载中...</div>;

  const { tenant, conversations, orders } = data;

  function startEdit() {
    setForm({
      name: tenant.name,
      roomNo: tenant.roomNo,
      phone: tenant.phone,
      managerId: tenant.managerId || "",
      leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart).toISOString().split("T")[0] : "",
      leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd).toISOString().split("T")[0] : "",
      monthlyRent: tenant.monthlyRent,
      billStatus: tenant.billStatus,
      overdueDays: tenant.overdueDays,
      totalDue: tenant.totalDue,
    });
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-stone-800">租客详情</h2>
        {!editing && (
          <button
            onClick={startEdit}
            className="px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            编辑信息
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
        {editing ? (
          /* Edit mode */
          <div className="space-y-5">
            <h3 className="font-display text-base font-semibold text-stone-700">编辑租客信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "姓名", key: "name" },
                { label: "房号", key: "roomNo" },
                { label: "手机号", key: "phone" },
                { label: "月租金", key: "monthlyRent", type: "number" },
              ].map((f) => (
                <div key={f.key} className={f.key === "name" || f.key === "phone" ? "col-span-2" : ""}>
                  <label className="text-xs text-stone-400 mb-1 block">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={form[f.key] || ""}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="text-xs text-stone-400 mb-1 block">指派管家</label>
                <select
                  value={form.managerId || ""}
                  onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                >
                  <option value="">暂不分配</option>
                  {managers.map((m: any) => (
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
                  value={form.leaseStart || ""}
                  onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">租期结束</label>
                <input
                  type="date"
                  value={form.leaseEnd || ""}
                  onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">账单状态</label>
                <select
                  value={form.billStatus || "normal"}
                  onChange={(e) => {
                    setForm({ ...form, billStatus: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                >
                  <option value="normal">正常</option>
                  <option value="overdue">逾期</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">逾期天数</label>
                <input
                  type="number"
                  value={form.overdueDays || 0}
                  onChange={(e) => setForm({ ...form, overdueDays: Number(e.target.value), totalDue: form.monthlyRent * Math.ceil(Number(e.target.value) / 30) })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-300"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl hover:bg-stone-100">
                取消
              </button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-50">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl font-bold">
                {tenant.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-stone-800">{tenant.name}</h3>
                <p className="text-sm text-stone-400">{tenant.roomNo}</p>
              </div>
              <span className={`ml-auto text-xs px-3 py-1.5 rounded-xl ${
                tenant.activated ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
              }`}>
                {tenant.activated ? "已激活" : "未激活"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                { label: "手机", value: tenant.phone },
                { label: "月租", value: `¥${tenant.monthlyRent}` },
                { label: "管家", value: (() => {
                  const mgr = managers.find((m: any) => m.id === tenant.managerId);
                  return mgr ? `${mgr.name}${mgr.isOnDuty ? " · 值班中" : " · 离线"}` : "未分配";
                })() },
                { label: "账单", value: tenant.billStatus === "overdue" ? `逾期${tenant.overdueDays}天·¥${tenant.totalDue}` : "正常" },
                { label: "租期", value: `${new Date(tenant.leaseStart).toLocaleDateString("zh-CN")} ~ ${new Date(tenant.leaseEnd).toLocaleDateString("zh-CN")}` },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-stone-400 mb-0.5">{item.label}</p>
                  <p className="text-stone-700">{item.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Conversations */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
        <h3 className="font-display text-base font-semibold text-stone-700 mb-4">对话记录 ({conversations?.length || 0})</h3>
        {!conversations || conversations.length === 0 ? (
          <p className="text-stone-300 text-sm py-4 text-center">暂无对话记录</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((c: any) => {
              const msgs = JSON.parse(c.messages || "[]");
              return (
                <div key={c.id} className="bg-stone-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg ${c.resolved ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {c.resolved ? "AI已解决" : "已转人工"}
                    </span>
                    <span className="text-xs text-stone-400">{new Date(c.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <div className="space-y-1">
                    {msgs.slice(0, 4).map((m: any, i: number) => (
                      <p key={i} className={`text-sm ${m.role === "user" ? "text-stone-500" : "text-stone-700"}`}>
                        <span className="text-stone-300 mr-2">{m.role === "user" ? "租客" : "AI"}:</span>
                        {m.content.slice(0, 80)}{m.content.length > 80 ? "..." : ""}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Work Orders */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6">
        <h3 className="font-display text-base font-semibold text-stone-700 mb-4">报修记录 ({orders?.length || 0})</h3>
        {!orders || orders.length === 0 ? (
          <p className="text-stone-300 text-sm py-4 text-center">暂无报修记录</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center gap-4 py-3 border-b border-stone-50 last:border-0">
                <span className="font-mono text-xs text-stone-400">{o.orderNo}</span>
                <span className="text-sm text-stone-700">{o.aiSummary || o.description}</span>
                <span className={`text-xs px-2 py-1 rounded-lg ml-auto ${
                  o.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                  o.status === "in_progress" ? "bg-blue-50 text-blue-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {o.status === "pending" ? "待处理" : o.status === "in_progress" ? "进行中" : "已完成"}
                </span>
                <span className="text-xs text-stone-300">{new Date(o.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
