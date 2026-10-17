/**
 * Split disposable browser-only logins into synthetic network identities.
 * This is NOT a production rate-limit bypass: both the Next app and Supabase
 * targets MUST point at plain-HTTP loopback servers, or this throws.
 */
export function disposableLoginHeaders(lastOctet: number): Record<string, string> {
  const appUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!dbUrl || !Number.isInteger(lastOctet) || lastOctet < 20 || lastOctet > 99) {
    throw new Error("Test-only browser identity requires a local Supabase URL and reserved IP");
  }
  for (const value of [appUrl, dbUrl]) {
    const url = new URL(value);
    if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)) {
      throw new Error("Never set synthetic browser identity headers outside disposable loopback E2E");
    }
  }
  // RFC 5737 TEST-NET-2 address. Separate browser flows must not exhaust one
  // shared IP quota; the actual production login rate limiter stays unchanged.
  return { "x-forwarded-for": `198.51.100.${lastOctet}` };
}
