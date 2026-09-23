import "server-only";

import { createHash } from "node:crypto";

export async function isKnownCompromisedPassword(password: string) {
  if (!password) return false;

  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      cache: "no-store",
      headers: {
        "user-agent": "VirtualAssistant.com.ph password safety",
        "Add-Padding": "true",
      },
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      console.warn("[password-safety] HIBP range lookup failed", { status: response.status });
      return false;
    }

    const body = await response.text();
    return body.split(/\r?\n/).some((line) => {
      const [candidateSuffix, rawCount] = line.split(":");
      if (!candidateSuffix || candidateSuffix.toUpperCase() !== suffix) return false;
      return Number(rawCount || 0) > 0;
    });
  } catch (error) {
    console.warn("[password-safety] HIBP range lookup unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}
