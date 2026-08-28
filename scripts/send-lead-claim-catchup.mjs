// One-time catch-up: sends the new "claim your draft" email to every
// currently-stuck unlinked lead, then marks them nudged so the daily cron
// doesn't double-send. Mirrors runLeadClaimNudges/sendClaimDraftEmail in
// the app exactly, run standalone since server-only TS can't be imported
// outside the Next.js runtime.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const { data: jobs, error: jobsErr } = await admin.from("jobs").select("id,title,lead_id,client_id").is("client_id", null).not("lead_id", "is", null);
if (jobsErr) { console.error(jobsErr); process.exit(1); }

const leadIds = [...new Set(jobs.map(j => j.lead_id).filter(Boolean))];
const { data: leads, error: leadsErr } = await admin.from("lead_intake").select("id,name,email,nudged_at").in("id", leadIds);
if (leadsErr) { console.error(leadsErr); process.exit(1); }
const leadMap = new Map(leads.map(l => [l.id, l]));

let sent = 0;
for (const job of jobs) {
  const lead = leadMap.get(job.lead_id);
  if (!lead?.email) { console.log(`Skipping "${job.title}" -- no email on file.`); continue; }

  const firstName = lead.name?.trim().split(" ")[0] || "there";
  const joinUrl = `${appUrl}/auth/join/client?lead=${encodeURIComponent(lead.id)}`;
  const { error: sendErr } = await resend.emails.send({
    from,
    to: [lead.email],
    subject: `Your VA request is ready -- ${job.title}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You asked about hiring for <strong>${escapeHtml(job.title)}</strong> on VirtualAssistant.com.ph. We've kept that request as a private draft -- create a free client account with this same email address (${escapeHtml(lead.email)}) and it'll be waiting for you, ready to review matched candidates.</p><p><a href="${joinUrl}">Create your client account</a></p><p>If you no longer need this, no action is needed -- just ignore this email.</p>`
  });
  if (sendErr) { console.log(`FAILED "${job.title}" -> ${lead.email}:`, sendErr.message || sendErr); continue; }

  await admin.from("lead_intake").update({ nudged_at: new Date().toISOString() }).eq("id", lead.id);
  sent += 1;
  console.log(`Sent -> ${lead.email} ("${job.title}")`);
}

console.log(`\nDone. ${sent}/${jobs.length} emails sent.`);
