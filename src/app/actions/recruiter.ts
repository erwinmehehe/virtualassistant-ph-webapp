"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { sendProfileCompletionReminderEmail } from "@/lib/email";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { writeAdminAudit } from "@/lib/admin-audit";
import { PUBLIC_VA_MIN_COMPLETION, isRowApprovable } from "@/lib/public-visibility";

const allowedBulkActions = new Set(["approve", "approve_publish", "mark_reviewed", "bench", "reject", "request_changes", "hide", "assign", "remind"]);

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function numberParam(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function filteredVaIds(formData: FormData) {
  const admin = createAdminClient();
  let query: any = admin.from("recruiter_va_directory").select("user_id,full_name,primary_category,completion_score,missing_items,last_activity_at,stage,account_status,edited_since_approval_at").limit(500);
  const stage = String(formData.get("filter_stage") || "");
  const readiness = String(formData.get("filter_readiness") || "");
  const photo = String(formData.get("filter_photo") || "");
  const resume = String(formData.get("filter_resume") || "");
  const availability = String(formData.get("filter_availability") || "");
  const skill = String(formData.get("filter_skill") || "").trim();
  const minExp = numberParam(formData.get("filter_min_experience"));
  const maxRate = numberParam(formData.get("filter_max_rate"));
  const stale = numberParam(formData.get("filter_stale"));
  const q = String(formData.get("filter_q") || "").trim().replace(/[,%()]/g, " ");

  if (stage) query = query.eq("stage", stage);
  if (availability) query = query.eq("availability_status", availability);
  if (skill) query = query.contains("skills", [skill]);
  if (minExp != null) query = query.gte("years_experience", minExp);
  if (maxRate != null) query = query.lte("hourly_rate", maxRate);
  if (readiness === "ready") query = query.gte("completion_score", PUBLIC_VA_MIN_COMPLETION).not("avatar_url", "is", null);
  if (readiness === "incomplete") query = query.lt("completion_score", 100).neq("stage", "rejected").eq("account_status", "active");
  if (readiness === "zero") query = query.eq("completion_score", 0).neq("stage", "rejected").eq("account_status", "active");
  if (photo === "yes") query = query.not("avatar_url", "is", null);
  if (photo === "no") query = query.is("avatar_url", null);
  if (resume === "yes") query = query.not("resume_path", "is", null);
  if (resume === "no") query = query.is("resume_path", null);
  if (stale != null && stale > 0) query = query.lt("last_activity_at", new Date(Date.now() - stale * 86400000).toISOString());
  if (q) query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,primary_category.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function resolveBulkRows(formData: FormData) {
  const selected = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))].slice(0, 500);
  if (String(formData.get("selection_scope") || "selected") === "filtered") return filteredVaIds(formData);
  if (!selected.length) return [];
  const { data, error } = await createAdminClient().from("recruiter_va_directory").select("user_id,full_name,primary_category,completion_score,missing_items,last_activity_at,stage,account_status,edited_since_approval_at").in("user_id", selected);
  if (error) throw error;
  return data || [];
}

export async function bulkRecruiterVaAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const action = String(formData.get("bulk_action") || "");
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/talent");
  if (!allowedBulkActions.has(action)) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=Choose%20a%20bulk%20action`);

  const rows: any[] = await resolveBulkRows(formData);
  const ids = rows.map((row) => String(row.user_id));
  if (!ids.length) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=No%20VAs%20matched%20that%20selection`);
  const admin = createAdminClient();
  const now = new Date().toISOString();
  let affected = 0;
  let published = 0;
  let skippedNames: string[] = [];

  try {
  if (action === "approve" || action === "approve_publish") {
    const eligible = rows.filter(isRowApprovable).map((row) => row.user_id);
    // Anyone the guard turned down is reported back by name. Silently dropping
    // them is why an earlier bulk run looked like it had done nothing.
    skippedNames = rows.filter((row) => !isRowApprovable(row)).map((row) => String(row.full_name || "Unnamed Virtual Assistant"));
    if (eligible.length) {
      const { error } = await admin.from("va_vetting").update({ stage: "approved", recruiter_id: user.id, approved_at: now, updated_at: now }).in("va_id", eligible);
      if (error) throw error;
      affected = eligible.length;
      await admin.from("notifications").insert(eligible.map((id: string) => ({ user_id: id, type: "profile_approved", title: "Your Virtual Assistant profile is approved", body: "Your profile is approved and can now be considered for client roles.", href: "/workspace/va/vetting" })));
      if (action === "approve_publish") {
        // directory_visible is necessary but not sufficient: public_va_directory
        // still enforces photo, resume, bio, skills, rate and the 2-year
        // minimum, so setting it on a profile that falls short is harmless.
        const { error: publishError } = await admin.from("va_profiles").update({ directory_visible: true }).in("user_id", eligible);
        if (publishError) throw publishError;
        const { count } = await admin.from("public_va_directory").select("user_id", { count: "exact", head: true }).in("user_id", eligible);
        published = count || 0;
      }
    }
  } else if (action === "mark_reviewed") {
    // Clears the "edited since approval" flag. The VA never left the directory,
    // so this only records that a recruiter looked at the change.
    const { error } = await admin.from("va_vetting").update({ edited_since_approval_at: null, profile_reviewed_at: now, updated_at: now }).in("va_id", ids);
    if (error) throw error;
    affected = ids.length;
  } else if (action === "bench") {
    const eligible = rows.filter((row) => ["approved", "bench"].includes(String(row.stage)) && row.primary_category);
    if (eligible.length) {
      await admin.from("bench_memberships").upsert(eligible.map((row) => ({ va_id: row.user_id, category: row.primary_category, status: "active", priority: 3, created_by: user.id })), { onConflict: "va_id,category" });
      await admin.from("va_vetting").update({ stage: "bench", recruiter_id: user.id, updated_at: now }).in("va_id", eligible.map((row) => row.user_id));
      affected = eligible.length;
    }
  } else if (action === "reject") {
    const { error } = await admin.from("va_vetting").update({ stage: "rejected", recruiter_id: user.id, rejected_at: now, updated_at: now }).in("va_id", ids);
    if (error) throw error;
    affected = ids.length;
  } else if (action === "request_changes") {
    const { error } = await admin.from("va_vetting").update({ stage: "profile", recruiter_id: user.id, changes_requested_at: now, updated_at: now }).in("va_id", ids);
    if (error) throw error;
    await admin.from("va_profiles").update({ directory_visible: false }).in("user_id", ids);
    await admin.from("notifications").insert(ids.map((id) => ({ user_id: id, type: "profile_update_request", title: "Please update your Virtual Assistant profile", body: "Your recruiter requested profile updates before the next review. Open your profile to see what is incomplete.", href: "/workspace/va/profile" })));
    affected = ids.length;
  } else if (action === "hide") {
    const { error } = await admin.from("va_profiles").update({ directory_visible: false }).in("user_id", ids);
    if (error) throw error;
    affected = ids.length;
  } else if (action === "assign") {
    const jobId = String(formData.get("job_id") || "");
    if (!jobId) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=Choose%20a%20role%20before%20assigning`);
    const { data: job } = await admin.from("jobs").select("*").eq("id", jobId).in("status", ["pending", "published"]).maybeSingle();
    if (!job) throw new Error("Role is not available for matching.");
    const eligibleIds = rows.filter((row) => ["approved", "bench"].includes(String(row.stage))).map((row) => row.user_id);
    const { data: vaRows } = eligibleIds.length ? await admin.from("va_profiles").select("*").in("user_id", eligibleIds) : { data: [] as any[] };
    const inserts = (vaRows || []).map((va: any) => {
      const assessment = matchAssessment(job, va);
      return { job_id: jobId, va_id: va.user_id, match_score: assessment.score, match_confidence: assessment.confidence, shortlist_status: "proposed", created_by: user.id, updated_at: now };
    });
    if (inserts.length) {
      const { error } = await admin.from("job_shortlist_candidates").upsert(inserts, { onConflict: "job_id,va_id" });
      if (error) throw error;
      affected = inserts.length;
      await Promise.all(inserts.map((row) => writeRecruiterActivity({ subjectType: "va", subjectId: row.va_id, action: "assigned_to_role", description: `Assigned to ${job.title}`, actorId: user.id, metadata: { job_id: jobId } })));
      await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "vas_assigned", description: `${inserts.length} VA${inserts.length === 1 ? "" : "s"} assigned to the role`, actorId: user.id, metadata: { va_ids: inserts.map((r) => r.va_id) } });
    }
  } else if (action === "remind") {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const { data: reminders } = await admin.from("va_profile_reminders").select("va_id,last_sent_at,reminder_count").in("va_id", ids);
    const reminderMap = new Map((reminders || []).map((row: any) => [row.va_id, row]));
    const { data: names } = await admin.from("profiles").select("id,full_name,account_status").in("id", ids);
    const nameMap = new Map((names || []).map((row: any) => [row.id, row.full_name]));
    const statusMap = new Map((names || []).map((row: any) => [row.id, row.account_status || "active"]));
    for (const row of rows) {
      if (String(row.account_status || statusMap.get(row.user_id) || "active") !== "active") continue;
      if (Number(row.completion_score || 0) >= 100) continue;
      const previous: any = reminderMap.get(row.user_id);
      if (Number(previous?.reminder_count || 0) >= 3) continue;
      if (previous?.last_sent_at && Date.now() - new Date(previous.last_sent_at).getTime() < 7 * 86400000) continue;
      const { data } = await admin.auth.admin.getUserById(row.user_id);
      if (!data.user?.email) continue;
      const result = await sendProfileCompletionReminderEmail({ to: data.user.email, fullName: nameMap.get(row.user_id), score: Number(row.completion_score || 0), missing: Array.isArray(row.missing_items) ? row.missing_items : [], appUrl });
      if (!result.sent) continue;
      await admin.from("va_profile_reminders").upsert({ va_id: row.user_id, reminder_count: Number(previous?.reminder_count || 0) + 1, last_score: Number(row.completion_score || 0), last_sent_at: now, last_sent_by: user.id, updated_at: now }, { onConflict: "va_id" });
      affected += 1;
    }
  }

  } catch (error) {
    // redirect() signals itself by throwing; never swallow that.
    if (error && typeof error === "object" && String((error as any).digest || "").startsWith("NEXT_REDIRECT")) throw error;
    const message = error instanceof Error ? error.message : String(error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=${encodeURIComponent(message.slice(0, 300))}`);
  }

  await writeAdminAudit({ actorId: user.id, action: `recruiter_bulk_${action}`, targetType: "va", metadata: { requested: ids.length, affected, published, skipped: skippedNames.length } });
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/talent");
  revalidatePath("/workspace/recruiter/queue");
  revalidatePath("/workspace/recruiter/matching");
  revalidatePath("/find-talent");
  const extra = new URLSearchParams();
  extra.set("bulk_done", action);
  extra.set("affected", String(affected));
  if (action === "approve_publish") extra.set("published", String(published));
  if (skippedNames.length) extra.set("skipped", skippedNames.slice(0, 5).join(", ") + (skippedNames.length > 5 ? ` and ${skippedNames.length - 5} more` : ""));
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${extra.toString()}`);
}

export async function addRecruiterNoteAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const subjectType = String(formData.get("subject_type") || "") as "va" | "job" | "lead";
  const subjectId = String(formData.get("subject_id") || "");
  const note = String(formData.get("note") || "").trim();
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter");
  if (!subjectId || !["va", "job", "lead"].includes(subjectType) || note.length < 2 || note.length > 4000) throw new Error("Add a valid private note.");
  const admin = createAdminClient();
  const { error } = await admin.from("recruiter_notes").insert({ subject_type: subjectType, subject_id: subjectId, note, created_by: user.id });
  if (error) throw error;
  await writeRecruiterActivity({ subjectType, subjectId, action: "note_added", description: "Private recruiter note added", actorId: user.id });
  revalidatePath(returnTo);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}note_saved=1`);
}

export async function recordLeadContactAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "");
  const contactType = String(formData.get("contact_type") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 1000);
  const allowed = new Set(["email", "call", "meeting", "follow_up"]);
  if (!leadId || !allowed.has(contactType)) throw new Error("Choose a valid client contact update.");

  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,job_id,name,email").eq("id", leadId).maybeSingle();
  if (!lead) throw new Error("Lead not found.");

  const labels: Record<string, string> = {
    email: "Client emailed",
    call: "Client called",
    meeting: "Client meeting completed",
    follow_up: "Client follow-up recorded"
  };
  const description = note || labels[contactType];

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: `client_contact_${contactType}`,
    description,
    actorId: user.id,
    metadata: { contact_type: contactType, client_email: lead.email || null, client_name: lead.name || null, job_id: lead.job_id || null }
  });

  if (lead.job_id) {
    await writeRecruiterActivity({
      subjectType: "job",
      subjectId: lead.job_id,
      action: `client_contact_${contactType}`,
      description,
      actorId: user.id,
      metadata: { contact_type: contactType, lead_id: leadId }
    });
    revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
  }

  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
}

export async function markVaReviewEvidenceAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const vaId = String(formData.get("va_id") || "");
  const kind = String(formData.get("kind") || "");
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/candidates/${vaId}`);
  if (!vaId || !["profile", "resume"].includes(kind)) throw new Error("Invalid review update.");
  const field = kind === "profile" ? "profile_reviewed_at" : "resume_reviewed_at";
  const now = new Date().toISOString();
  const { error } = await createAdminClient().from("va_vetting").update({ [field]: now, recruiter_id: user.id, updated_at: now }).eq("va_id", vaId);
  if (error) throw error;
  await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: `${kind}_reviewed`, description: `${kind === "profile" ? "Profile" : "Resume"} reviewed`, actorId: user.id });
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function assignVaToRoleAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const vaId = String(formData.get("va_id") || "");
  const jobId = String(formData.get("job_id") || "");
  const returnTo = safePath(formData.get("return_to"), `/workspace/recruiter/candidates/${vaId}`);
  if (!vaId || !jobId) throw new Error("Choose a VA and role.");
  const admin = createAdminClient();
  const [{ data: job }, { data: va }, { data: vetting }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).in("status", ["pending", "published"]).maybeSingle(),
    admin.from("va_profiles").select("*").eq("user_id", vaId).maybeSingle(),
    admin.from("va_vetting").select("stage").eq("va_id", vaId).maybeSingle()
  ]);
  if (!job || !va || !vetting || !["approved", "bench"].includes(vetting.stage)) throw new Error("This Virtual Assistant must be approved or benched before role assignment.");
  const assessment = matchAssessment(job, va);
  const { error } = await admin.from("job_shortlist_candidates").upsert({ job_id: jobId, va_id: vaId, match_score: assessment.score, match_confidence: assessment.confidence, shortlist_status: "proposed", created_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "job_id,va_id" });
  if (error) throw error;
  await writeRecruiterActivity({ subjectType: "va", subjectId: vaId, action: "assigned_to_role", description: `Assigned to ${job.title}`, actorId: user.id, metadata: { job_id: jobId } });
  await writeRecruiterActivity({ subjectType: "job", subjectId: jobId, action: "va_assigned", description: "Virtual Assistant assigned to role", actorId: user.id, metadata: { va_id: vaId } });
  revalidatePath(returnTo);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}assigned=1`);
}

export async function archiveStaleRolesAction(formData: FormData) {
  const { user } = await requireAnyRole(["admin"]);
  const days = Math.max(30, Math.min(365, Number(formData.get("days") || 90)));
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const admin = createAdminClient();
  const { data: rows, error } = await admin.from("jobs").update({ status: "closed", closed_at: new Date().toISOString() }).in("status", ["draft", "pending"]).lt("updated_at", cutoff).select("id");
  if (error) throw error;
  await writeAdminAudit({ actorId: user.id, action: "archive_stale_roles", targetType: "job", metadata: { days, count: rows?.length || 0 } });
  revalidatePath("/workspace/admin/health");
  redirect(`/workspace/admin/health?archived=${rows?.length || 0}`);
}

export async function repairVaRecordsAction() {
  const { user } = await requireAnyRole(["admin"]);
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id").eq("role", "va");
  const ids = (profiles || []).map((p: any) => p.id);
  const { data: existingVa } = ids.length ? await admin.from("va_profiles").select("user_id,slug").in("user_id", ids) : { data: [] as any[] };
  const vaMap = new Map((existingVa || []).map((v: any) => [v.user_id, v]));
  const missing = ids.filter((id) => !vaMap.has(id));
  if (missing.length) await admin.from("va_profiles").insert(missing.map((id) => ({ user_id: id, slug: `va-${id.replaceAll("-", "").slice(0, 12)}` })));
  const missingSlug = (existingVa || []).filter((v: any) => !String(v.slug || "").trim());
  for (const row of missingSlug) await admin.from("va_profiles").update({ slug: `va-${String(row.user_id).replaceAll("-", "").slice(0, 12)}`, updated_at: new Date().toISOString() }).eq("user_id", row.user_id);
  const { data: vetting } = ids.length ? await admin.from("va_vetting").select("va_id").in("va_id", ids) : { data: [] as any[] };
  const vettingIds = new Set((vetting || []).map((v: any) => v.va_id));
  const missingVetting = ids.filter((id) => !vettingIds.has(id));
  if (missingVetting.length) await admin.from("va_vetting").insert(missingVetting.map((id) => ({ va_id: id, stage: "profile" })));
  await writeAdminAudit({ actorId: user.id, action: "repair_va_records", targetType: "va", metadata: { created_profiles: missing.length, generated_slugs: missingSlug.length, created_vetting: missingVetting.length } });
  revalidatePath("/workspace/admin/health");
  redirect(`/workspace/admin/health?repaired=${missing.length + missingSlug.length + missingVetting.length}`);
}

export async function hideIncompletePublicProfilesAction() {
  const { user } = await requireAnyRole(["admin"]);
  const admin = createAdminClient();
  const { data: rows } = await admin.from("recruiter_va_directory").select("user_id").eq("directory_visible", true).lt("completion_score", 100).limit(500);
  const ids = (rows || []).map((r: any) => r.user_id);
  if (ids.length) await admin.from("va_profiles").update({ directory_visible: false }).in("user_id", ids);
  await writeAdminAudit({ actorId: user.id, action: "hide_incomplete_public_profiles", targetType: "va", metadata: { count: ids.length } });
  revalidatePath("/workspace/admin/health");
  revalidatePath("/find-talent");
  redirect(`/workspace/admin/health?hidden=${ids.length}`);
}
