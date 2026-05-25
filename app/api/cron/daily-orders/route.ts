import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type OrderRow = {
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  quantity_kg: number | null;
  total_amount: number | null;
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("payment_status", "confirmed")
    .gte("created_at", `${dateStr}T00:00:00`)
    .lte("created_at", `${dateStr}T23:59:59`)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[daily-orders] Supabase error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ message: "No orders yesterday" });
  }

  const deliveryEmail = process.env.DELIVERY_EMAIL;
  if (!deliveryEmail) {
    console.error("[daily-orders] DELIVERY_EMAIL is missing");
    return NextResponse.json({ error: "DELIVERY_EMAIL not configured" }, { status: 500 });
  }

  const rows = (orders as OrderRow[])
    .map(
      (o) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${o.customer_name ?? "—"}</td>
      <td style="padding:8px;border:1px solid #ddd;">${o.customer_phone ?? "—"}</td>
      <td style="padding:8px;border:1px solid #ddd;">${o.delivery_address ?? "—"}</td>
      <td style="padding:8px;border:1px solid #ddd;">${o.quantity_kg ?? "—"}кг</td>
      <td style="padding:8px;border:1px solid #ddd;">${o.total_amount?.toLocaleString() ?? "—"}₮</td>
    </tr>
  `
    )
    .join("");

  const totalAmount = (orders as OrderRow[]).reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );

  const { error: emailError } = await resend.emails.send({
    from: "ТИТЭМ <noreply@acnation.net>",
    to: deliveryEmail,
    subject: `🚚 ТИТЭМ хүргэлтийн захиалгууд — ${dateStr}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;">
        <h2 style="color:#c8740a;">🍯 ТИТЭМ — Өдрийн захиалгууд</h2>
        <p><strong>Огноо:</strong> ${dateStr}</p>
        <p><strong>Нийт захиалга:</strong> ${orders.length} ширхэг</p>
        <p><strong>Нийт дүн:</strong> ${totalAmount.toLocaleString()}₮</p>
        <br/>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Нэр</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Утас</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Хаяг</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Хэмжээ</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Дүн</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <br/>
        <p style="color:#888;font-size:12px;">ТИТЭМ автомат системийн мэдэгдэл</p>
      </div>
    `,
  });

  if (emailError) {
    console.error("[daily-orders] Resend error:", emailError);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orders: orders.length,
    total: totalAmount,
  });
}
