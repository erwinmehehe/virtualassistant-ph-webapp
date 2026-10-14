import "server-only";

import { createHash } from "node:crypto";

// null means the breach-check service was unreachable; never silently treat it as safe.
export async function isKnownCompromisedPassword(password: string): Promise<boolean | null> {
  if (!password) return null;

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
      return null;
    }

    const body = await response.text();
    const rows = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    // A malformed 200 response must not be mistaken for "not compromised".
    if (!rows.length || rows.some((line) => !/^[A-Fa-f0-9]{35}:[0-9]+$/.test(line))) {
      console.warn("[password-safety] HIBP range lookup returned an invalid response");
      return null;
    }
    return rows.some((line) => {
      const [candidateSuffix, rawCount] = line.split(":");
      return candidateSuffix.toUpperCase() === suffix && Number(rawCount) > 0;
    });
  } catch (error) {
    console.warn("[password-safety] HIBP range lookup unavailable", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
