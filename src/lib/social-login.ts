/**
 * Social sign-in is opt-in per provider.
 *
 * A provider should only be exposed after its OAuth application is registered
 * and the matching Supabase Auth provider is configured. Keeping the switches
 * separate prevents enabling Google from accidentally exposing a broken
 * Microsoft button, or vice versa.
 */
function enabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

export function googleLoginEnabled() {
  return enabled(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED);
}

export function microsoftLoginEnabled() {
  return enabled(process.env.NEXT_PUBLIC_MICROSOFT_LOGIN_ENABLED);
}

export function socialLoginEnabled() {
  return googleLoginEnabled() || microsoftLoginEnabled();
}

export function socialProviderEnabled(provider: "google" | "azure") {
  return provider === "google" ? googleLoginEnabled() : microsoftLoginEnabled();
}
