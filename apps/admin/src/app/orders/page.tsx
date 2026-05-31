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
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Edit state
  const [showEdit, setShowEdit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

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

  async function deleteOrder(id: string) {
    if (!confirm("确认删除该工单？此操作不可撤销。")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setSelectedOrder(null);
    load();
  }

  function openEdit(o: any) {
    setEditForm({ ...o });
    setShowEdit(o);
  }

  async function saveEdit() {
    await fetch(`/api/admin/orders/${showEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setShowEdit(null);
    setEditForm({});
    load();
    // Refresh detail panel if same order is open
    if (selectedOrder?.id === showEdit.id) {
      setSelectedOrder({ ...selectedOrder, ...editForm });
    }
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
                <th className="text-left px-5 py-3 font-medium">联系电话</th>
                <th className="text-left px-5 py-3 font-medium">上门时间</th>
                <th className="text-left px-5 py-3 font-medium">摘要</th>
                <th className="text-left px-5 py-3 font-medium">状态</th>
                <th className="text-left px-5 py-3 font-medium">师傅</th>
                <th className="text-left px-5 py-3 font-medium">时间</th>
                <th className="text-left px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-mono text-xs text-stone-500">{o.orderNo}</td>
                  <td className="px-5 py-3 text-stone-700">{o.roomNo}</td>
                  <td className="px-5 py-3 text-stone-700">{o.tenantName}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 bg-stone-50 rounded-lg text-stone-500">
                      {categoryMap[o.category] || o.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-stone-700 text-sm">{o.contactPhone || o.phone || "-"}</td>
                  <td className="px-5 py-3 text-stone-600 text-sm">{o.visitTime || "-"}</td>
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
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
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
                      <button
                        onClick={() => deleteOrder(o.id)}
                        className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Panel */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Panel header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display text-lg font-semibold text-stone-800">工单详情</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(selectedOrder)}
                  className="px-3 py-1.5 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => deleteOrder(selectedOrder.id)}
                  className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                >
                  删除
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Panel content */}
            <div className="p-6 space-y-5">
              {/* Order number + status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-stone-500">{selectedOrder.orderNo}</span>
                <span className={`text-xs px-2.5 py-1 rounded-lg ${statusMap[selectedOrder.status]?.className}`}>
                  {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                </span>
              </div>

              {/* Tenant */}
              <div>
                <p className="text-xs text-stone-400 mb-1">租客信息</p>
                <p className="text-sm text-stone-700 font-medium">{selectedOrder.tenantName} · {selectedOrder.roomNo}</p>
                <p className="text-xs text-stone-400 mt-0.5">电话：{selectedOrder.contactPhone || selectedOrder.phone || "-"}</p>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-stone-400 mb-1">维修类别</p>
                <span className="text-xs px-2 py-1 bg-stone-50 rounded-lg text-stone-600">
                  {categoryMap[selectedOrder.category] || selectedOrder.category}
                </span>
              </div>

              {/* Visit time */}
              <div>
                <p className="text-xs text-stone-400 mb-1">期望上门时间</p>
                <p className="text-sm text-stone-700">{selectedOrder.visitTime || "未指定"}</p>
              </div>

              {/* Full description */}
              <div>
                <p className="text-xs text-stone-400 mb-1">问题描述</p>
                <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-3 leading-relaxed">{selectedOrder.description || "-"}</p>
              </div>

              {/* AI Summary */}
              <div>
                <p className="text-xs text-stone-400 mb-1">AI 摘要</p>
                <p className="text-sm text-stone-600">{selectedOrder.aiSummary || "-"}</p>
              </div>

              {/* Assignee */}
              <div>
                <p className="text-xs text-stone-400 mb-1">指派师傅</p>
                <p className="text-sm text-stone-700">{selectedOrder.assignee || "未指派"}</p>
              </div>

              {/* Timestamps */}
              <div className="flex gap-4 text-xs text-stone-400">
                <span>创建：{new Date(selectedOrder.createdAt).toLocaleString("zh-CN")}</span>
                {selectedOrder.completedAt && (
                  <span>完成：{new Date(selectedOrder.completedAt).toLocaleString("zh-CN")}</span>
                )}
              </div>

              {/* Images */}
              {(() => {
                try {
                  const imgs = JSON.parse(selectedOrder.images);
                  if (Array.isArray(imgs) && imgs.length > 0) {
                    return (
                      <div>
                        <p className="text-xs text-stone-400 mb-2">现场照片</p>
                        <div className="grid grid-cols-2 gap-2">
                          {imgs.map((src: string, i: number) => (
                            <a key={i} href={src} target="_blank" rel="noreferrer">
                              <img src={src} alt={`现场照片${i + 1}`} className="w-full h-32 object-cover rounded-xl border border-stone-200 hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch {}
                return (
                  <div>
                    <p className="text-xs text-stone-400 mb-2">现场照片</p>
                    <p className="text-sm text-stone-400">无</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

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

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-lg font-semibold text-stone-800 mb-4">编辑工单</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-stone-400">工单号</span>
                  <input
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl bg-stone-50 text-stone-400"
                    value={editForm.orderNo || ""}
                    disabled
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-stone-400">状态</span>
                  <select
                    value={editForm.status || ""}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                  >
                    {Object.entries(statusMap).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-stone-400">租客姓名</span>
                  <input
                    value={editForm.tenantName || ""}
                    onChange={(e) => setEditForm({ ...editForm, tenantName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-stone-400">房号</span>
                  <input
                    value={editForm.roomNo || ""}
                    onChange={(e) => setEditForm({ ...editForm, roomNo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-stone-400">联系电话</span>
                  <input
                    value={editForm.contactPhone || editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-stone-400">维修类别</span>
                  <select
                    value={editForm.category || "other"}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                  >
                    {Object.entries(categoryMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-stone-400">上门时间</span>
                <input
                  value={editForm.visitTime || ""}
                  onChange={(e) => setEditForm({ ...editForm, visitTime: e.target.value })}
                  placeholder="如：明天上午9点"
                  className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-stone-400">问题描述</span>
                <textarea
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none resize-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-stone-400">AI 摘要</span>
                <textarea
                  value={editForm.aiSummary || ""}
                  onChange={(e) => setEditForm({ ...editForm, aiSummary: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none resize-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-stone-400">指派师傅</span>
                <input
                  value={editForm.assignee || ""}
                  onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-sm border border-stone-200 rounded-xl focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowEdit(null); setEditForm({}); }}
                className="flex-1 py-2.5 text-sm text-stone-400 bg-stone-50 rounded-xl hover:bg-stone-100"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
