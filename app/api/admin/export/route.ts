import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type OrderRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  quantity_kg: number | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  delivery_address: string | null;
  created_at: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Төлсөн",
  unpaid: "Төлөөгүй",
  confirmed: "Баталгаажсан",
  pending: "Хүлээгдэж байна",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  confirmed: "Баталгаажсан",
  shipped: "Илгээсэн",
  delivered: "Хүргэгдсэн",
};

function csvEscape(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatExportDate(date: string): string {
  return new Date(date).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Захиалгын дугаар",
    "Нэр",
    "Утас",
    "Имэйл",
    "Хэмжээ (кг)",
    "Дүн (₮)",
    "Төлбөрийн байдал",
    "Захиалгын байдал",
    "Хаяг",
    "Огноо",
  ];

  const rows = (data ?? []).map((o: OrderRow) => [
    o.id.slice(0, 8).toUpperCase(),
    o.customer_name ?? "",
    o.customer_phone ?? "",
    o.customer_email ?? "",
    o.quantity_kg ?? "",
    o.total_amount ?? "",
    PAYMENT_LABELS[o.payment_status ?? ""] ?? o.payment_status ?? "",
    STATUS_LABELS[o.status ?? ""] ?? o.status ?? "",
    o.delivery_address ?? "",
    formatExportDate(o.created_at),
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const filename = `titim-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
