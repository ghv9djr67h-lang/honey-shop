import { NextRequest, NextResponse } from "next/server";
import {
  getSiteContent,
  saveSiteContentField,
  SITE_CONTENT_FIELDS,
  type SiteContent,
} from "@/lib/site-content";

export async function GET() {
  try {
    const content = await getSiteContent();
    const rows = SITE_CONTENT_FIELDS.map((field) => ({
      id: field.id,
      value: content[field.id],
    }));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json({ error: "Контент авахад алдаа гарлаа" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id, value } = (await req.json()) as { id: keyof SiteContent; value: string };

    if (!id || typeof value !== "string") {
      return NextResponse.json({ error: "Буруу өгөгдөл" }, { status: 400 });
    }

    const { error } = await saveSiteContentField(id, value);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Content POST error:", error);
    return NextResponse.json({ error: "Хадгалахад алдаа гарлаа" }, { status: 500 });
  }
}
