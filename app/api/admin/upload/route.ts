import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = (formData.get("bucket") as string) || "product-images";

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
    }

    if (bucket !== "product-images") {
      return NextResponse.json({ error: "Буруу bucket" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const supabase = createServerSupabaseClient();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { contentType: file.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Зураг хадгалахад алдаа гарлаа" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Серверийн алдаа гарлаа" }, { status: 500 });
  }
}
