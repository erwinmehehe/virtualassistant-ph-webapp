const EMAIL_PATTERN = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;
const PHONE_PATTERN = /(?:\+?\d[\d ().-]{7,}\d)/;
const EXTERNAL_CONTACT_PATTERN = /\b(?:whats?app|telegram|skype|viber|discord|messenger)\b|(?:facebook|linkedin|instagram)\.com|\b(?:mailto|tel):/i;
const DIRECT_PAYMENT_PATTERN = /(?:(?:pay|send|transfer|settle).{0,40}(?:gcash|maya|paymaya|wise|payoneer|bank transfer|instapay|pesonet)|(?:gcash|maya|paymaya|wise|payoneer|bank transfer|instapay|pesonet).{0,40}(?:pay|send|transfer|settle))/i;
const CIRCUMVENTION_PATTERN = /\b(?:off[- ]platform|outside (?:of )?(?:the )?platform|hire (?:me|him|her|them) directly|direct hire|bypass.{0,40}(?:fee|platform)|avoid.{0,40}(?:fee|platform))\b/i;

export type HiringCircumventionSignal =
  | "email"
  | "phone"
  | "external_contact"
  | "direct_payment"
  | "circumvention";

export function hiringCircumventionSignals(parts: Array<string | string[] | null | undefined>) {
  const text = parts
    .flatMap((part) => Array.isArray(part) ? part : [part])
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

  const signals: HiringCircumventionSignal[] = [];
  if (EMAIL_PATTERN.test(text)) signals.push("email");
  if (PHONE_PATTERN.test(text)) signals.push("phone");
  if (EXTERNAL_CONTACT_PATTERN.test(text)) signals.push("external_contact");
  if (DIRECT_PAYMENT_PATTERN.test(text)) signals.push("direct_payment");
  if (CIRCUMVENTION_PATTERN.test(text)) signals.push("circumvention");
  return signals;
}

export function assertPublicHiringContentSafe(parts: Array<string | string[] | null | undefined>) {
  const signals = hiringCircumventionSignals(parts);
  if (!signals.length) return;

  throw new Error(
    "Remove personal contact details, external messaging handles, direct-payment instructions, or off-platform hiring language before this role can be submitted or published. Keep candidate contact and hiring inside VAPH.",
  );
}
