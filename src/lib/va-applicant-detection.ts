/**
 * Flags hiring-form submissions that read like a Virtual Assistant applying for
 * work rather than a business hiring one. Deliberately conservative: it only
 * matches first-person job-seeking phrases, so a client describing the role
 * ("a VA who has applied these skills...") is not caught. Flagged leads are kept
 * (lead_type va_support) so an admin can still review them.
 */

const APPLICANT_PATTERNS: RegExp[] = [
  /\bi\s*(?:am|'m)\s+(?:an?\s+)?(?:experienced\s+|aspiring\s+|freelance\s+|professional\s+|general\s+)?(?:virtual\s+assistant|va)\b(?!\s+(?:agency|agencies|company|business|firm|provider|owner|founder|manager|recruiter))/i,
  /\b(?:i\s+(?:want|would\s+like|wish)\s+to|i\s*(?:am|'m))\s+apply(?:ing)?\b/i,
  /\bapply(?:ing)?\s+(?:for|as)\s+(?:the\s+|a\s+|an\s+)?(?:position|job|role|vacancy|virtual\s+assistant|va)\b/i,
  /\bhire\s+me\b/i,
  /\bmy\s+(?:resume|cv)\b(?!\s+(?:screening|review|reviews|workflow|workflows|builder|parsing|database|pipeline))/i,
  /\b(?:attached(?:\s+is)?|here\s+is)\s+my\s+(?:resume|cv|portfolio)\b/i,
  /\blooking\s+for\s+(?:a\s+|an\s+)?(?:job|online\s+job|online\s+work|work\s+from\s+home(?:\s+job)?|part[\s-]?time\s+job|full[\s-]?time\s+job|remote\s+job)\b/i,
  /\b(?:your|the)\s+job\s+(?:opening|vacancy)\b/i,
  /\binterested\s+in\s+(?:the|this|your)\s+(?:position|job|vacancy|opening)\b/i,
];

export function looksLikeVaApplication(...texts: Array<string | null | undefined>) {
  const text = texts.filter(Boolean).join("\n");
  if (!text.trim()) return false;
  return APPLICANT_PATTERNS.some((pattern) => pattern.test(text));
}

export const VA_APPLICANT_SOURCE_PAGE = "va_applicant_redirect";
