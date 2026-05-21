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

const STATUS_OPTIONS = [
  { value: "pending", label: "Хүлээгдэж байна" },
  { value: "confirmed", label: "Баталгаажсан" },
  { value: "shipped", label: "Илгээсэн" },
  { value: "delivered", label: "Хүргэгдсэн" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setOrders(d.orders);
      })
      .catch(() => setError("Ачааллахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(orderId: string, status: string) {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      setSelected(data.order);
      setMessage("Статус амжилттай шинэчлэгдлээ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Ачааллаж байна...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Захиалгууд</h1>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {message && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Нэр</th>
                  <th className="px-4 py-3">Утас</th>
                  <th className="px-4 py-3">Дүн</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Төлбөр</th>
                  <th className="px-4 py-3">Огноо</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => {
                      setSelected(order);
                      setMessage("");
                      setError("");
                    }}
                    className={`cursor-pointer hover:bg-amber-50 ${
                      selected?.id === order.id ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{shortId(order.id)}</td>
                    <td className="px-4 py-3">{order.customer_name || "—"}</td>
                    <td className="px-4 py-3">{order.customer_phone || "—"}</td>
                    <td className="px-4 py-3">{formatMNT(order.total_amount)}</td>
                    <td className="px-4 py-3 text-xs">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {PAYMENT_LABELS[order.payment_status] ?? order.payment_status}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Захиалгын дэлгэрэнгүй</h2>
              <dl className="space-y-2 text-sm">
                <Row label="ID" value={selected.id} mono />
                <Row label="Нэр" value={selected.customer_name || "—"} />
                <Row label="Утас" value={selected.customer_phone || "—"} />
                <Row label="Имэйл" value={selected.customer_email || "—"} />
                <Row label="Хаяг" value={selected.delivery_address || "—"} />
                <Row label="Хэмжээ" value={`${selected.quantity_kg}кг`} />
                <Row label="Дүн" value={formatMNT(selected.total_amount)} />
                <Row
                  label="Төлбөр"
                  value={PAYMENT_LABELS[selected.payment_status] ?? selected.payment_status}
                />
                <Row label="Огноо" value={formatDate(selected.created_at)} />
                {selected.notes && <Row label="Тэмдэглэл" value={selected.notes} />}
              </dl>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Статус өөрчлөх
                </label>
                <select
                  value={selected.status}
                  disabled={saving}
                  onChange={(e) => updateStatus(selected.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Захиалга сонгоно уу</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`font-medium text-gray-900 ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
