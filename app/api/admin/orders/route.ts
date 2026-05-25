import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const orderId = request.nextUrl.searchParams.get("id");

    if (orderId) {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
      }

      return NextResponse.json({ order });
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .or("payment_status.eq.confirmed,status.neq.pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders list error:", error);
      return NextResponse.json({ error: "Захиалга авахад алдаа гарлаа" }, { status: 500 });
    }

    return NextResponse.json({ orders: orders ?? [] });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const order_id = body.order_id as string;
    const status = body.status as string;

    const validStatuses = ["pending", "confirmed", "shipped", "delivered"];
    if (!order_id || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Буруу мэдээлэл" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order_id)
      .select("*")
      .single();

    if (error) {
      console.error("Order status update error:", error);
      return NextResponse.json({ error: "Статус шинэчлэхэд алдаа гарлаа" }, { status: 500 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Admin orders PATCH error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("id");
    if (!orderId) {
      return NextResponse.json({ error: "Захиалгын ID олдсонгүй" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      console.error("Order delete error:", error);
      return NextResponse.json({ error: "Захиалга устгахад алдаа гарлаа" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin orders DELETE error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
