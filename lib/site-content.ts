import { supabaseAdmin } from "@/lib/supabase";
import {
  DEFAULT_SITE_CONTENT,
  type SiteContent,
} from "@/lib/site-content-types";

export type { SiteContent } from "@/lib/site-content-types";
export {
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_FIELDS,
} from "@/lib/site-content-types";

const SITE_CONTENT_KEY = "site_content";

function mergeSiteContent(raw: Partial<SiteContent> | null | undefined): SiteContent {
  return { ...DEFAULT_SITE_CONTENT, ...raw };
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", SITE_CONTENT_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_SITE_CONTENT;
    }

    return mergeSiteContent(data.value as Partial<SiteContent>);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export async function saveSiteContentField(
  id: keyof SiteContent,
  value: string,
): Promise<{ error?: string }> {
  const current = await getSiteContent();
  const updated = { ...current, [id]: value };

  const { error } = await supabaseAdmin.from("settings").upsert(
    {
      key: SITE_CONTENT_KEY,
      value: updated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) return { error: error.message };
  return {};
}
