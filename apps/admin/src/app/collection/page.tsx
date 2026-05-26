"use client";

import { useEffect, useState } from "react";

export default function CollectionPage() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/collections").then((r) => r.json()).then(setCollections);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h2 className="font-display text-2xl font-bold text-stone-800">催租管理</h2>

      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">租客</th>
                <th className="text-left px-5 py-3 font-medium">房号</th>
                <th className="text-left px-5 py-3 font-medium">月租</th>
                <th className="text-left px-5 py-3 font-medium">逾期天数</th>
                <th className="text-left px-5 py-3 font-medium">欠费总额</th>
                <th className="text-left px-5 py-3 font-medium">建议话术</th>
                <th className="text-left px-5 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-b border-stone-50">
                  <td className="px-5 py-3 text-stone-700 font-medium">{c.tenantName}</td>
                  <td className="px-5 py-3 text-stone-500">{c.roomNo}</td>
                  <td className="px-5 py-3 text-stone-600">¥{c.monthlyRent}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      c.overdueDays >= 7 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {c.overdueDays}天
                    </span>
                  </td>
                  <td className="px-5 py-3 font-display font-semibold text-rose-500">¥{c.totalDue}</td>
                  <td className="px-5 py-3 text-stone-500 max-w-[300px] truncate">{c.suggestedMsg}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-lg bg-stone-50 text-stone-400">
                      {c.status === "pending" ? "待催收" : "已提醒"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
