import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id шаардлагатай" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, payment_status, status")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quantity_kg = Number(body.quantity_kg);
    const total_amount = Number(body.total_amount);

    if (!quantity_kg || !total_amount) {
      return NextResponse.json(
        { error: "Бүтээгдэхүүн сонгоно уу" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        delivery_address: "",
        quantity_kg,
        total_amount,
        status: "pending",
        payment_status: "unpaid",
        image_urls: [],
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Захиалга хадгалахад алдаа гарлаа" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, order_id: order.id });
  } catch (error) {
    console.error("Order POST error:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const order_id = body.order_id as string;
    const customer_name = body.customer_name as string;
    const customer_phone = body.customer_phone as string;
    const customer_email = body.customer_email as string;
    const delivery_address = body.delivery_address as string;
    const notes = (body.notes as string) || null;

    if (
      !order_id ||
      !customer_name ||
      !customer_phone ||
      !customer_email ||
      !delivery_address
    ) {
      return NextResponse.json(
        { error: "Бүх талбарыг бөглөнө үү" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({
        customer_name,
        customer_phone,
        customer_email,
        delivery_address,
        notes,
        status: "confirmed",
      })
      .eq("id", order_id)
      .select("id")
      .single();

    if (orderError) {
      console.error("Order update error:", orderError);
      return NextResponse.json(
        { error: "Захиалга шинэчлэхэд алдаа гарлаа" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, order_id: order.id });
  } catch (error) {
    console.error("Order PATCH error:", error);
    return NextResponse.json(
      { error: "Серверийн алдаа гарлаа" },
      { status: 500 },
    );
  }
}
