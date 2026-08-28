/**
 * Best-effort detection of messages that suggest a client/VA pair is trying
 * to move payment or contact off-platform. This is intentionally
 * conservative: it flags for human review, it never auto-bans. Keyword and
 * pattern matching always has false positives (e.g. a VA whose specialty
 * is literally "GCash reconciliation"), so a match should prompt an admin
 * to read the actual message, not trigger an automatic penalty.
 */

const PAYMENT_APP_TERMS = [
  "gcash", "paymaya", "maya wallet", "paypal.me", "venmo", "cash app", "cashapp",
  "wise.com", "remitly", "western union", "moneygram", "wechat pay", "alipay"
];

const CONTACT_APP_TERMS = [
  "whatsapp", "telegram", "wechat", "viber", "signal app", "skype id"
];

const CIRCUMVENTION_PHRASES = [
  "pay you directly", "pay me directly", "pay him directly", "pay her directly",
  "outside the platform", "off the platform", "off platform", "avoid the fee",
  "avoid the platform fee", "skip the platform", "bypass the platform",
  "without going through", "no need to go through", "under the table",
  "cut out the middle", "save on fees", "instead of paying through"
];

const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}\b/;
const EMAIL_REGEX = /[a-z0-9._%+-]+@(?!virtualassistant\.com\.ph)[a-z0-9.-]+\.[a-z]{2,}/i;

export function detectCircumvention(text: string): { matched: boolean; terms: string[] } {
  const lower = text.toLowerCase();
  const terms: string[] = [];

  for (const term of [...PAYMENT_APP_TERMS, ...CONTACT_APP_TERMS, ...CIRCUMVENTION_PHRASES]) {
    if (lower.includes(term)) terms.push(term);
  }
  if (PHONE_REGEX.test(text)) terms.push("phone number pattern");
  if (EMAIL_REGEX.test(text)) terms.push("external email address");

  return { matched: terms.length > 0, terms };
}
