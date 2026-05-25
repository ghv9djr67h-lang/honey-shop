import { HomePage } from "@/components/HomePage";
import { getBrandSettings } from "@/lib/brand-settings";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [content, brand] = await Promise.all([getSiteContent(), getBrandSettings()]);
  return <HomePage content={content} brand={brand} />;
}
