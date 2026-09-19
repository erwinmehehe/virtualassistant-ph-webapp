import "server-only";

/**
 * IndexNow submission. ChatGPT's search leans on Bing's index, so getting new
 * and updated pages into Bing quickly is the cheapest AI-visibility lever we
 * have. Submitting unchanged URLs is treated as spam by the protocol, so
 * callers pass only what actually changed.
 *
 * Disabled until INDEXNOW_KEY is set; the key is also served at
 * /indexnow-key.txt so Bing can verify ownership.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10000;

export function indexNowKey() {
  const key = process.env.INDEXNOW_KEY?.trim() || "";
  // The protocol requires 8-128 hexadecimal characters.
  return /^[a-f0-9]{8,128}$/i.test(key) ? key : "";
}

export async function submitToIndexNow(urls: string[]) {
  const key = indexNowKey();
  if (!key) return { submitted: 0 as const, reason: "indexnow_not_configured" as const };

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const host = new URL(base).host;
  const urlList = [...new Set(urls.filter((url) => url.startsWith(`${base}/`)))].slice(0, MAX_URLS);
  if (!urlList.length) return { submitted: 0 as const, reason: "nothing_changed" as const };

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${base}/indexnow-key.txt`, urlList })
    });
    // 200 and 202 both mean accepted; anything else is logged, never thrown,
    // because search submission must not fail the job that triggered it.
    if (!response.ok) return { submitted: 0 as const, reason: `indexnow_${response.status}` as const };
    return { submitted: urlList.length, reason: "ok" as const };
  } catch {
    return { submitted: 0 as const, reason: "indexnow_unreachable" as const };
  }
}
