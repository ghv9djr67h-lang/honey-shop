import { supabaseAdmin } from "@/lib/supabase";

export type SiteContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_price: string;
  about_text: string;
  delivery_text: string;
  contact_phone: string;
  footer_text: string;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_title: "Байгалийн Цэвэр Сархинагтай Зөгийн Бал",
  hero_subtitle:
    "Байгаль эхийн бүтээсэн яг тэрхүү төгс хэлбэрээрээ таны гарт хүрч буй шим тэжээлийн охь",
  hero_price: "39,000₮",
  about_text:
    "Өвөрмонголын уулсын олон төрлийн зэрлэг цэцгийн шүүснээс хураасан, 100% байгалийн гаралтай зөгийн бал",
  delivery_text: "Өнөөдөр захиалбал маргааш өдөртөө хүрнэ",
  contact_phone: "9666-5040",
  footer_text: "© 2026 Титэм. Бүх эрх хуулиар хамгаалагдсан.",
};

export const SITE_CONTENT_FIELDS: { id: keyof SiteContent; label: string }[] = [
  { id: "hero_title", label: "Гарчиг" },
  { id: "hero_subtitle", label: "Дэд гарчиг" },
  { id: "hero_price", label: "Үнэ" },
  { id: "about_text", label: "Танилцуулга" },
  { id: "delivery_text", label: "Хүргэлт" },
  { id: "contact_phone", label: "Утас" },
  { id: "footer_text", label: "Footer" },
];

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const { data, error } = await supabaseAdmin.from("site_content").select("*");

    if (error || !data) {
      console.error("[site-content] fetch error:", error);
      return DEFAULT_SITE_CONTENT;
    }

    const content = Object.fromEntries(data.map((row) => [row.id, row.value])) as Partial<
      SiteContent
    >;

    return { ...DEFAULT_SITE_CONTENT, ...content };
  } catch (err) {
    console.error("[site-content] exception:", err);
    return DEFAULT_SITE_CONTENT;
  }
}
