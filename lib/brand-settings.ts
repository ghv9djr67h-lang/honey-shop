import { DEFAULT_BRAND_SETTINGS, normalizeBrandSettings } from "@/lib/admin/settings-defaults";
import { supabaseAdmin } from "@/lib/supabase";

type RawBrandSettings = Parameters<typeof normalizeBrandSettings>[0];

export async function getBrandSettings() {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "brand")
      .maybeSingle();

    if (error || !data?.value) {
      return DEFAULT_BRAND_SETTINGS;
    }

    return normalizeBrandSettings(data.value as RawBrandSettings);
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}
