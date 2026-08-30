/**
 * Disposable / throwaway inbox domains.
 *
 * Addresses at these providers are public: anyone can read the inbox without a
 * password, so an account tied to one can never be verified, cannot receive a
 * password reset safely, and is not a person we can contact about a role.
 *
 * Deliberately a small, hand-checked list rather than a large scraped one --
 * a false positive here blocks a real signup, which is far more costly than
 * letting through the occasional throwaway address.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.fr",
  "getnada.com",
  "dispostable.com",
  "trashmail.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mohmal.com",
  "emailondeck.com",
  "mailnesia.com",
  "spamgourmet.com",
  "tempinbox.com",
  "moakt.com",
  "inboxkitten.com",
  "burnermail.io"
]);

export function isDisposableEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Catch subdomain forms such as inbox.mailinator.com without matching an
  // unrelated domain that merely ends in the same letters.
  return [...DISPOSABLE_DOMAINS].some((blocked) => domain.endsWith(`.${blocked}`));
}
