// One-time backfill: cleans up job summary/description text for jobs that
// were created before the auto-cleanup pass existed (src/lib/job-content-cleanup.ts)
// and still hold the client's raw, unedited message verbatim. Mirrors that
// module's logic exactly -- kept as a plain script since server-only TS
// can't be imported outside the Next.js runtime.
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const admin = createClient(url, key);

const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}\b/g;
const EMAIL_REGEX = /[a-z0-9._%+-]+@(?!virtualassistant\.com\.ph)[a-z0-9.-]+\.[a-z]{2,}/gi;
const URL_REGEX = /\bhttps?:\/\/\S+/gi;
const SUMMARY_MAX_LENGTH = 320;

function collapseWhitespace(text) {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
    .split("\n").map((l) => l.trim()).join("\n").trim();
}
function redactContactDetails(text) {
  return text.replace(EMAIL_REGEX, "[email removed]").replace(URL_REGEX, "[link removed]")
    .replace(PHONE_REGEX, (m) => (m.replace(/\D/g, "").length >= 7 ? "[phone removed]" : m));
}
function capitalizeFirst(text) { return text.length ? text[0].toUpperCase() + text.slice(1) : text; }
function ensureTerminalPunctuation(text) { return /[.!?]$/.test(text) ? text : `${text}.`; }
function cleanJobDescription(raw) {
  if (!raw) return raw ?? null;
  const cleaned = collapseWhitespace(redactContactDetails(raw));
  return cleaned || null;
}
function cleanJobSummary(raw, fallback) {
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
  if (summary.length > SUMMARY_MAX_LENGTH) summary = `${summary.slice(0, SUMMARY_MAX_LENGTH - 1).trim()}…`;
  return ensureTerminalPunctuation(capitalizeFirst(summary));
}

const { data: jobs, error } = await admin.from("jobs").select("id,title,service_model,summary,description,categories,status").in("status", ["pending", "published"]);
if (error) { console.error(error); process.exit(1); }

// Only touch jobs that still look like the raw client message was never
// cleaned up: summary === description verbatim is exactly what the old
// code path produced (both filled from the same raw `message`).
const candidates = jobs.filter((j) => j.summary && j.description && j.summary === j.description);

console.log(`${jobs.length} pending/published jobs checked, ${candidates.length} look uncleaned.`);

let updated = 0;
for (const job of candidates) {
  const fallback = `VA support requested for ${job.categories?.[0] || "business operations"}.`;
  const newSummary = cleanJobSummary(job.summary, fallback);
  const newDescription = cleanJobDescription(job.description);
  if (newSummary === job.summary && newDescription === job.description) continue;
  const { error: updateError } = await admin.from("jobs").update({ summary: newSummary, description: newDescription }).eq("id", job.id);
  if (updateError) { console.error(`Failed to update ${job.id} (${job.title}):`, updateError.message); continue; }
  updated += 1;
  console.log(`Updated "${job.title}" (${job.id})`);
  console.log(`  before: ${job.summary.slice(0, 90)}...`);
  console.log(`  after:  ${newSummary}`);
}

console.log(`\nDone. ${updated} job(s) updated.`);
