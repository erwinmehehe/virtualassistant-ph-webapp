const suspiciousJobPatterns = [
  /\btelegram\b/i,
  /\bwhats\s*app\b/i,
  /\bcrypto(currency)?\b/i,
  /\bregistration fee\b/i,
  /\bsecurity deposit\b/i,
  /\bpay (us|me) first\b/i,
  /\bunpaid trial\b/i,
  /\bcommission[- ]only\b/i,
  /\bgift cards?\b/i
];

export function jobModerationStatus(text: string) {
  return suspiciousJobPatterns.some((pattern) => pattern.test(text)) ? "review" as const : "clear" as const;
}
