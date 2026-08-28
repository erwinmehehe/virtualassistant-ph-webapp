export async function verifyTurnstile(formData: FormData) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  // The challenge can only be solved if the widget actually rendered, and it
  // renders only when the public site key is present in the build. A secret
  // without a site key therefore rejects every submission with no way for the
  // visitor to pass -- it locks people out of login, signup and password reset
  // entirely. Treat that combination as "Turnstile is not configured" rather
  // than as a failed challenge.
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not; skipping the challenge because the widget cannot render.");
    return true;
  }

  const token = String(formData.get("cf-turnstile-response") || "").trim();
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    const result = await response.json() as { success?: boolean };
    return Boolean(result.success);
  } catch {
    return false;
  }
}
