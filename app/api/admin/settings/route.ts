import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_PRODUCT_SETTINGS,
  type BrandSettings,
  type ProductSettings,
  type SettingsKey,
} from "@/lib/admin/settings-defaults";

async function getSetting<T>(key: SettingsKey, fallback: T): Promise<T> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("settings").select("value").eq("key", key).single();
  return (data?.value as T) ?? fallback;
}

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key") as SettingsKey | null;

    if (key === "product") {
      const value = await getSetting<ProductSettings>("product", DEFAULT_PRODUCT_SETTINGS);
      return NextResponse.json({ settings: value });
    }

    if (key === "brand") {
      const value = await getSetting<BrandSettings>("brand", DEFAULT_BRAND_SETTINGS);
      return NextResponse.json({ settings: value });
    }

    const [product, brand] = await Promise.all([
      getSetting<ProductSettings>("product", DEFAULT_PRODUCT_SETTINGS),
      getSetting<BrandSettings>("brand", DEFAULT_BRAND_SETTINGS),
    ]);

    return NextResponse.json({ product, brand });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Тохиргоо авахад алдаа гарлаа" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const key = body.key as SettingsKey;
    const value = body.value;

    if (key !== "product" && key !== "brand") {
      return NextResponse.json({ error: "Буруу түлхүүр" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.from("settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      console.error("Settings save error:", error);
      return NextResponse.json({ error: "Хадгалахад алдаа гарлаа" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
