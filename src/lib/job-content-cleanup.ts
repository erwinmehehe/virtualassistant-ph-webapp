import "server-only";

/**
 * Client match-request messages come in as raw, unedited free text -- often
 * pasted straight from an email, with no punctuation cleanup, and sometimes
 * with the client's own contact details in the middle of it. Those messages
 * become a job's public "summary" and "description", so this does a light,
 * rule-based tidy pass before anything goes public. It is deliberately
 * conservative: it never rewrites meaning, only formatting and redaction.
 */

const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}\b/g;
const EMAIL_REGEX = /[a-z0-9._%+-]+@(?!virtualassistant\.com\.ph)[a-z0-9.-]+\.[a-z]{2,}/gi;
const URL_REGEX = /\bhttps?:\/\/\S+/gi;

const SUMMARY_MAX_LENGTH = 320;

function collapseWhitespace(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n").map((line) => line.trim()).join("\n")
    .trim();
}

/**
 * Removes anything that looks like a way to reach the client directly. This
 * is a privacy fix as much as a tone one -- a client's phone number or
 * personal email has no reason to be sitting in a public job listing.
 */
function redactContactDetails(text: string) {
  return text
    .replace(EMAIL_REGEX, "[email removed]")
    .replace(URL_REGEX, "[link removed]")
    .replace(PHONE_REGEX, (match) => (match.replace(/\D/g, "").length >= 7 ? "[phone removed]" : match));
}

function capitalizeFirst(text: string) {
  return text.length ? text[0].toUpperCase() + text.slice(1) : text;
}

function ensureTerminalPunctuation(text: string) {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/**
 * Public-facing description: full detail preserved, just de-identified and
 * normalized -- this is what a candidate reads on the job detail page.
 */
export function cleanJobDescription(raw: string | null | undefined): string | null {
  if (!raw) return raw ?? null;
  const cleaned = collapseWhitespace(redactContactDetails(raw));
  return cleaned || null;
}

/**
 * Short public-facing teaser shown on job cards and listing pages. Trims to
 * the first couple of sentences (or a hard character cap) so a long,
 * unstructured message doesn't dominate the card, and falls back to a
 * generic line if nothing usable is left after cleanup.
 */
export function cleanJobSummary(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  const cleaned = collapseWhitespace(redactContactDetails(raw)).replace(/\n+/g, " ");
  if (!cleaned) return fallback;

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
  let summary = "";
  for (const sentence of sentences) {
    const next = `${summary}${summary ? " " : ""}${sentence.trim()}`;
    if (next.length > SUMMARY_MAX_LENGTH && summary) break;
    summary = next;
    if (summary.length >= SUMMARY_MAX_LENGTH) break;
  }
  if (summary.length > SUMMARY_MAX_LENGTH) {
    summary = `${summary.slice(0, SUMMARY_MAX_LENGTH - 1).trim()}…`;
  }
  return ensureTerminalPunctuation(capitalizeFirst(summary));
}
