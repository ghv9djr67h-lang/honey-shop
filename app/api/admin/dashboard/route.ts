import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, total_amount, payment_status, status, created_at, customer_name, customer_phone, quantity_kg")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard error:", error);
      return NextResponse.json({ error: "Мэдээлэл авахад алдаа гарлаа" }, { status: 500 });
    }

    const all = orders ?? [];
    const paid = all.filter((o) => o.payment_status === "paid");
    const unpaid = all.filter((o) => o.payment_status !== "paid");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = paid
      .filter((o) => new Date(o.created_at) >= today)
      .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

    return NextResponse.json({
      stats: {
        total: all.length,
        paid: paid.length,
        unpaid: unpaid.length,
        todayRevenue,
      },
      recentOrders: all.slice(0, 10),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
