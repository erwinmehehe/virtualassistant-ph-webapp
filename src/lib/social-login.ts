/**
 * Social (Google / Microsoft) sign-in is opt-in.
 *
 * The buttons are only useful once the provider is configured in Supabase AND
 * the OAuth client is registered with Google/Azure. Until then they fail after
 * the user has already committed to a sign-in, which is worse than not offering
 * them. Set NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED=true to turn them back on.
 */
export function socialLoginEnabled() {
  return process.env.NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED?.trim().toLowerCase() === "true";
}
