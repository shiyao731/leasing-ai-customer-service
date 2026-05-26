"use client";

import { useEffect, useState } from "react";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-amber-50 text-amber-600" },
  assigned: { label: "已派单", className: "bg-blue-50 text-blue-600" },
  in_progress: { label: "进行中", className: "bg-indigo-50 text-indigo-600" },
  completed: { label: "已完成", className: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "已取消", className: "bg-stone-50 text-stone-400" },
};

const categoryMap: Record<string, string> = {
  appliance: "家电",
  plumbing: "水电",
  doorlock: "门锁",
  other: "其他",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState("");

  const load = () => {
    fetch(`/api/admin/orders${filter !== "all" ? `?status=${filter}` : ""}`)
      .then((r) => r.json())
      .then(setOrders);
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => {
    fetch("/api/admin/staff").then((r) => r.json()).then(setStaff);
  }, []);

  async function assignOrder(id: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "assigned", assignee: selectedStaff }),
    });
    setShowAssign(null);
    setSelectedStaff("");
    load();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold text-stone-800">工单管理</h2>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "assigned", "in_progress", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              filter === f
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white text-stone-500 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {f === "all" ? "全部" : statusMap[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">工单号</th>
                <th className="text-left px-5 py-3 font-medium">房号</th>
                <th className="text-left px-5 py-3 font-medium">租客</th>
                <th className="text-left px-5 py-3 font-medium">类别</th>
                <th className="text-left px-5 py-3 font-medium">摘要</th>
                <th className="text-left px-5 py-3 font-medium">状态</th>
                <th className="text-left px-5 py-3 font-medium">师傅</th>
                <th className="text-left px-5 py-3 font-medium">时间</th>
                <th className="text-left px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-stone-500">{o.orderNo}</td>
                  <td className="px-5 py-3 text-stone-700">{o.roomNo}</td>
                  <td className="px-5 py-3 text-stone-700">{o.tenantName}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 bg-stone-50 rounded-lg text-stone-500">
                      {categoryMap[o.category] || o.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-600 max-w-[150px] truncate">{o.aiSummary || o.description}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${statusMap[o.status]?.className}`}>
                      {statusMap[o.status]?.label || o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-500">{o.assignee || "-"}</td>
                  <td className="px-5 py-3 text-xs text-stone-400">
                    {new Date(o.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      {o.status === "pending" && (
                        <button
                          onClick={() => setShowAssign(o.id)}
                          className="text-xs px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          派单
                        </button>
                      )}
                      {o.status === "assigned" && (
                        <button
                          onClick={() => updateStatus(o.id, "in_progress")}
                          className="text-xs px-2.5 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          开始处理
                        </button>
                      )}
                      {o.status === "in_progress" && (
                        <button
                          onClick={() => updateStatus(o.id, "completed")}
                          className="text-xs px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          完成
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">派单</h3>
            <div className="space-y-2 mb-5">
              {staff.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedStaff === s.name
                      ? "border-amber-300 bg-amber-50"
                      : "border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="staff"
                    value={s.name}
                    checked={selectedStaff === s.name}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="accent-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-700">{s.name}</p>
                    <p className="text-xs text-stone-400">
                      {categoryMap[s.specialty] || s.specialty} · {s.phone}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssign(null)}
                className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl hover:bg-stone-100"
              >
                取消
              </button>
              <button
                onClick={() => assignOrder(showAssign)}
                disabled={!selectedStaff}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-30 transition-all"
              >
                确认派单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
