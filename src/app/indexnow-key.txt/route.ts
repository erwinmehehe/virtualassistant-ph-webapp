import { indexNowKey } from "@/lib/indexnow";

/** Ownership proof for IndexNow submissions; 404s until INDEXNOW_KEY is set. */
export function GET() {
  const key = indexNowKey();
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(`${key}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400"
    }
  });
}
