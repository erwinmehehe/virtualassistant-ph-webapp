import { createSign } from "node:crypto";

export type GoogleIndexingNotificationType = "URL_UPDATED" | "URL_DELETED";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const GOOGLE_INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function credentials() {
  const email = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!email || !privateKey) return null;
  return { email, privateKey };
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const creds = credentials();
  if (!creds) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: creds.email,
      scope: GOOGLE_INDEXING_SCOPE,
      aud: GOOGLE_TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(creds.privateKey).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google OAuth token request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("Google OAuth token response did not include access_token.");

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: Date.now() + Math.max(60, Number(json.expires_in || 3600)) * 1000,
  };

  return cachedToken.accessToken;
}

function normalizeOwnedJobUrl(pathOrUrl: string) {
  const base = new URL((process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "") + "/");
  const url = new URL(pathOrUrl, base);

  if (url.origin !== base.origin) {
    throw new Error(`Refusing Google Indexing API notification for a different origin: ${url.origin}`);
  }

  if (!/^\/jobs\/[^/]+\/?$/.test(url.pathname)) {
    throw new Error(`Google Indexing API is restricted here to individual /jobs/ URLs: ${url.pathname}`);
  }

  url.hash = "";
  return url.toString();
}

export async function notifyGoogleIndexing(
  pathOrUrl: string,
  type: GoogleIndexingNotificationType,
) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false as const, skipped: true as const, reason: "credentials_missing" as const };
  }

  const url = normalizeOwnedJobUrl(pathOrUrl);
  const response = await fetch(GOOGLE_INDEXING_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type }),
    cache: "no-store",
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Indexing API failed for ${url} (${response.status}): ${body.slice(0, 500)}`);
  }

  return { ok: true as const, skipped: false as const, url, type };
}

export async function notifyGoogleIndexingBestEffort(
  pathOrUrl: string,
  type: GoogleIndexingNotificationType,
) {
  try {
    return await notifyGoogleIndexing(pathOrUrl, type);
  } catch (error) {
    console.warn("[google-indexing]", error instanceof Error ? error.message : error);
    return { ok: false as const, skipped: false as const, reason: "request_failed" as const };
  }
}
