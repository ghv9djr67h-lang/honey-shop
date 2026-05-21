"use client";

export const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  confirmed: "Баталгаажсан",
  shipped: "Илгээсэн",
  delivered: "Хүргэгдсэн",
};

export const PAYMENT_LABELS: Record<string, string> = {
  paid: "Төлсөн",
  unpaid: "Төлөөгүй",
};

export function formatMNT(amount: number) {
  return `${amount.toLocaleString("mn-MN")}₮`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address?: string;
  quantity_kg: number;
  total_amount: number;
  status: string;
  payment_status: string;
  notes?: string;
  created_at: string;
};

export async function uploadImage(file: File, bucket = "product-images") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);

  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}
