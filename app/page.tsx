import { HomePage } from "@/components/HomePage";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function Page() {
  const content = await getSiteContent();
  return <HomePage content={content} />;
}
