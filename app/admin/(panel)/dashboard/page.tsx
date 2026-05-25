"use client";

import { useEffect, useState } from "react";
import {
  formatDate,
  formatMNT,
  PAYMENT_LABELS,
  shortId,
  STATUS_LABELS,
  type Order,
} from "@/lib/admin/utils";

type DashboardData = {
  stats: {
    total: number;
    paid: number;
    unpaid: number;
    todayRevenue: number;
  };
  recentOrders: Order[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Мэдээлэл авахад алдаа гарлаа"));
  }, []);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-gray-500">Ачааллаж байна...</p>;
  }

  const { stats, recentOrders } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Хяналтын самбар</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Нийт захиалга" value={String(stats.total)} />
        <StatCard label="Төлсөн" value={String(stats.paid)} accent="green" />
        <StatCard label="Төлөөгүй" value={String(stats.unpaid)} accent="red" />
        <StatCard label="Өнөөдрийн орлого" value={formatMNT(stats.todayRevenue)} accent="amber" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Сүүлийн 10 захиалга</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Дүн</th>
                <th className="px-4 py-3">Төлбөр</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Огноо</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{shortId(order.id)}</td>
                  <td className="px-4 py-3">{order.customer_name || "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatMNT(order.total_amount)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                      variant={order.payment_status === "paid" ? "green" : "gray"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={STATUS_LABELS[order.status] ?? order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Захиалга байхгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "gray",
}: {
  label: string;
  value: string;
  accent?: "gray" | "green" | "red" | "amber";
}) {
  const colors = {
    gray: "border-gray-200",
    green: "border-green-200 bg-green-50",
    red: "border-red-200 bg-red-50",
    amber: "border-amber-200 bg-amber-50",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[accent]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Badge({
  label,
  variant = "gray",
}: {
  label: string;
  variant?: "gray" | "green";
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        variant === "green" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
