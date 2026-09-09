"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchAssessment } from "@/lib/matching";
import { sendDiscoveryBookingEmail, sendProfileCompletionReminderEmail, sendStaffClientFollowupEmail } from "@/lib/email";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { writeAdminAudit } from "@/lib/admin-audit";
import { PUBLIC_VA_MIN_COMPLETION, isRowApprovable } from "@/lib/public-visibility";
import { isLeadCrmStage, legacyLeadStatus, type LeadCrmStage } from "@/lib/lead-crm";

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

export async function sendClientFollowupAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const jobId = String(formData.get("job_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/leads");
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if ((!leadId && !jobId) || subject.length < 3 || subject.length > 180 || message.length < 10 || message.length > 5000) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_error=${encodeURIComponent("Add a subject and a short client message.")}`);
  }

  const admin = createAdminClient();
  let recipient: string | null = null;
  let clientName: string | null = null;
  let activityType: "lead" | "job" = leadId ? "lead" : "job";
  let activityId = leadId || jobId;
  let linkedJobId = jobId;
  let leadSnapshot: any = null;

  if (leadId) {
    const { data: lead } = await admin.from("lead_intake")
      .select("id,email,name,job_id,crm_stage,owner_id,first_contact_at,next_follow_up_at")
      .eq("id", leadId)
      .maybeSingle();
    leadSnapshot = lead;
    recipient = lead?.email || null;
    clientName = lead?.name || null;
    linkedJobId = linkedJobId || String(lead?.job_id || "");
  }

  if (!recipient && jobId) {
    const { data: job } = await admin.from("jobs").select("id,title,client_id").eq("id", jobId).maybeSingle();
    if (job?.client_id) {
      const [{ data: authUser }, { data: account }] = await Promise.all([
        admin.auth.admin.getUserById(job.client_id),
        admin.from("profiles").select("full_name").eq("id", job.client_id).maybeSingle()
      ]);
      recipient = authUser.user?.email || null;
      clientName = account?.full_name || null;
    } else {
      const { data: lead } = await admin.from("lead_intake")
        .select("id,email,name,crm_stage,owner_id,first_contact_at,next_follow_up_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      recipient = lead?.email || null;
      clientName = lead?.name || null;
      if (lead?.id) {
        activityType = "lead";
        activityId = lead.id;
        leadSnapshot = lead;
      }
    }
  }

  if (!recipient) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_error=${encodeURIComponent("No client email is attached to this lead or role.")}`);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const href = linkedJobId ? `${appUrl}/workspace/client/jobs/${linkedJobId}` : undefined;
  const result = await sendStaffClientFollowupEmail({
    to: recipient,
    subject,
    message,
    senderName: profile.full_name || "VirtualAssistant.com.ph hiring team",
    href
  });
  if (!result.sent) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_error=${encodeURIComponent("Client email could not be sent. Check the email configuration and recipient address.")}`);
  }

  const now = new Date();
  if (activityType === "lead" && activityId) {
    if (!leadSnapshot) {
      const { data } = await admin.from("lead_intake")
        .select("id,crm_stage,owner_id,first_contact_at,next_follow_up_at")
        .eq("id", activityId)
        .maybeSingle();
      leadSnapshot = data;
    }
    if (leadSnapshot) {
      const existingFollowUp = leadSnapshot.next_follow_up_at ? new Date(leadSnapshot.next_follow_up_at).getTime() : 0;
      const patch: Record<string, unknown> = {
        last_contact_at: now.toISOString(),
        owner_id: leadSnapshot.owner_id || user.id,
        next_follow_up_at: existingFollowUp > now.getTime() ? leadSnapshot.next_follow_up_at : new Date(now.getTime() + 2 * 86400000).toISOString()
      };
      if (!leadSnapshot.first_contact_at) patch.first_contact_at = now.toISOString();
      if ((leadSnapshot.crm_stage || "new") === "new") {
        patch.crm_stage = "contacted";
        patch.stage_updated_at = now.toISOString();
      }
      await admin.from("lead_intake").update(patch).eq("id", activityId);
    }
  }

  await writeRecruiterActivity({
    subjectType: activityType,
    subjectId: activityId,
    action: "client_followup_sent",
    description: `Follow-up email sent${clientName ? ` to ${clientName}` : ""}: ${subject}`,
    actorId: user.id,
    metadata: { job_id: linkedJobId || null, recipient }
  });
  revalidatePath("/workspace/recruiter");
  revalidatePath(returnTo);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}contact_sent=1`);
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
  const { data: lead } = await admin.from("lead_intake")
    .select("id,job_id,name,email,crm_stage,owner_id,first_contact_at,next_follow_up_at")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) throw new Error("Lead not found.");

  const labels: Record<string, string> = {
    email: "Client emailed",
    call: "Client called",
    meeting: "Client meeting completed",
    follow_up: "Client follow-up recorded"
  };
  const description = note || labels[contactType];
  const now = new Date();
  const existingFollowUp = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : 0;
  const followUpDays = contactType === "meeting" ? 1 : contactType === "follow_up" ? 2 : 1;
  const patch: Record<string, unknown> = {
    last_contact_at: now.toISOString(),
    owner_id: lead.owner_id || user.id,
    next_follow_up_at: existingFollowUp > now.getTime() ? lead.next_follow_up_at : new Date(now.getTime() + followUpDays * 86400000).toISOString()
  };
  if (!lead.first_contact_at) patch.first_contact_at = now.toISOString();
  if ((lead.crm_stage || "new") === "new") {
    patch.crm_stage = "contacted";
    patch.stage_updated_at = now.toISOString();
  }
  const { error: updateError } = await admin.from("lead_intake").update(patch).eq("id", leadId);
  if (updateError) throw updateError;

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

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
}

export async function updateLeadCrmAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const stageRaw = String(formData.get("crm_stage") || "").trim();
  const ownerId = String(formData.get("owner_id") || "").trim();
  const followUpRaw = String(formData.get("next_follow_up_at") || "").trim();
  const estimatedRaw = String(formData.get("estimated_value_usd") || "").trim();
  const lostReason = String(formData.get("lost_reason") || "").trim().slice(0, 1000);
  const returnTo = safePath(formData.get("return_to"), profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/leads");

  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}crm_error=${encodeURIComponent(message)}`);
  if (!leadId || !isLeadCrmStage(stageRaw)) return fail("Choose a valid sales stage.");
  const stage = stageRaw as LeadCrmStage;

  let nextFollowUpAt: string | null = null;
  if (followUpRaw) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(followUpRaw)
      ? new Date(`${followUpRaw}T09:00:00+08:00`)
      : new Date(followUpRaw);
    if (!Number.isFinite(parsed.getTime())) return fail("Choose a valid follow-up date.");
    nextFollowUpAt = parsed.toISOString();
  }

  let estimatedValue: number | null = null;
  if (estimatedRaw) {
    estimatedValue = Number(estimatedRaw);
    if (!Number.isFinite(estimatedValue) || estimatedValue < 0 || estimatedValue > 10000000) return fail("Enter a valid estimated deal value.");
  }
  if (stage === "lost" && lostReason.length < 3) return fail("Add a short lost reason so the team can learn from it.");

  const admin = createAdminClient();
  if (ownerId) {
    const { data: owner } = await admin.from("profiles").select("id,role,account_status").eq("id", ownerId).maybeSingle();
    if (!owner || !["recruiter", "admin"].includes(owner.role) || owner.account_status !== "active") return fail("Choose an active recruiter or admin as the lead owner.");
  }

  const { data: lead } = await admin.from("lead_intake")
    .select("id,status,crm_stage,job_id,session_id,page_url,service,won_at,lost_at")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return fail("Lead not found.");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    crm_stage: stage,
    status: legacyLeadStatus(stage),
    owner_id: ownerId || null,
    next_follow_up_at: ["won", "lost"].includes(stage) ? null : nextFollowUpAt,
    estimated_value_usd: estimatedValue,
    lost_reason: stage === "lost" ? lostReason : null,
    stage_updated_at: now,
    won_at: stage === "won" ? (lead.won_at || now) : null,
    lost_at: stage === "lost" ? (lead.lost_at || now) : null
  };
  const { error } = await admin.from("lead_intake").update(patch).eq("id", leadId);
  if (error) return fail(error.message || "Could not update the lead.");

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: `lead_stage_${stage}`,
    description: `Sales stage changed to ${stage.replaceAll("_", " ")}`,
    actorId: user.id,
    metadata: {
      previous_stage: lead.crm_stage || null,
      owner_id: ownerId || null,
      next_follow_up_at: patch.next_follow_up_at,
      estimated_value_usd: estimatedValue,
      job_id: lead.job_id || null,
      lost_reason: stage === "lost" ? lostReason : null
    }
  });

  const qualifiedStages = new Set(["qualified", "shortlist_sent", "won"]);
  if (qualifiedStages.has(stage) && !qualifiedStages.has(String(lead.crm_stage || ""))) {
    let path = "/hire";
    try {
      if (lead.page_url) path = new URL(lead.page_url).pathname;
    } catch {}
    await admin.from("analytics_events").insert({
      event_name: "qualified_lead",
      path,
      session_id: lead.session_id || null,
      metadata: { lead_id: leadId, job_id: lead.job_id || null, service: lead.service || null, crm_stage: stage }
    });
  }
  if (stage === "won" && lead.crm_stage !== "won") {
    await admin.from("analytics_events").insert({
      event_name: "lead_won",
      path: "/workspace/recruiter/leads",
      session_id: lead.session_id || null,
      metadata: { lead_id: leadId, job_id: lead.job_id || null, estimated_value_usd: estimatedValue }
    });
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (lead.job_id) revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}crm_saved=1`);
}

export async function scheduleDiscoveryAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/leads");
  const raw = String(formData.get("discovery_scheduled_at") || "").trim();
  const duration = Math.max(15, Math.min(120, Number(formData.get("discovery_duration_minutes") || 30)));
  const meetingUrl = String(formData.get("discovery_meeting_url") || "").trim().slice(0, 1000);
  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}discovery_error=${encodeURIComponent(message)}`);

  if (!leadId || !raw) return fail("Choose a discovery call date and time.");
  const scheduled = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? new Date(`${raw}:00+08:00`)
    : new Date(raw);
  if (!Number.isFinite(scheduled.getTime())) return fail("Choose a valid discovery call date and time.");
  if (scheduled.getTime() < Date.now() - 15 * 60000) return fail("Discovery calls must be scheduled in the future.");
  if (meetingUrl && !/^https?:\/\//i.test(meetingUrl)) return fail("Meeting link must start with http:// or https://.");

  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake")
    .select("id,name,email,owner_id,crm_stage")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return fail("Lead not found.");

  const now = new Date().toISOString();
  const followUp = new Date(scheduled.getTime() + duration * 60000 + 60 * 60000).toISOString();
  const { error } = await admin.from("lead_intake").update({
    discovery_scheduled_at: scheduled.toISOString(),
    discovery_duration_minutes: duration,
    discovery_meeting_url: meetingUrl || null,
    discovery_completed_at: null,
    crm_stage: "discovery_booked",
    status: "new",
    owner_id: lead.owner_id || user.id,
    next_follow_up_at: followUp,
    stage_updated_at: now
  }).eq("id", leadId);
  if (error) return fail(error.message || "Could not schedule the discovery call.");

  const scheduledLabel = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila"
  }).format(scheduled);

  const emailResult = await sendDiscoveryBookingEmail({
    to: lead.email,
    clientName: lead.name,
    scheduledLabel,
    durationMinutes: duration,
    meetingUrl: meetingUrl || null,
    recruiterName: profile.full_name
  });

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "discovery_booked",
    description: `Discovery booked for ${scheduledLabel}`,
    actorId: user.id,
    metadata: { scheduled_at: scheduled.toISOString(), duration_minutes: duration, meeting_url: meetingUrl || null, email_sent: emailResult.sent }
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  const joiner = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${joiner}discovery_saved=1${emailResult.sent ? "" : "&discovery_email=failed"}`);
}

export async function completeDiscoveryAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), profile.role === "admin" ? "/workspace/admin/leads" : "/workspace/recruiter/leads");
  const outcome = String(formData.get("outcome") || "qualified");
  const notes = String(formData.get("discovery_notes") || "").trim().slice(0, 5000);
  const lostReason = String(formData.get("lost_reason") || "").trim().slice(0, 1000);
  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}discovery_error=${encodeURIComponent(message)}`);

  if (!leadId || !["qualified", "nurture", "lost"].includes(outcome)) return fail("Choose a valid discovery outcome.");
  if (outcome === "lost" && lostReason.length < 3) return fail("Add a short lost reason.");
  if (notes.length < 3) return fail("Add a short discovery note so the next recruiter knows what was agreed.");

  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake").select("id,crm_stage,job_id").eq("id", leadId).maybeSingle();
  if (!lead) return fail("Lead not found.");

  const now = new Date();
  const stage = outcome as LeadCrmStage;
  const nextFollowUp = stage === "qualified"
    ? new Date(now.getTime() + 86400000).toISOString()
    : stage === "nurture"
      ? new Date(now.getTime() + 14 * 86400000).toISOString()
      : null;

  const { error } = await admin.from("lead_intake").update({
    discovery_completed_at: now.toISOString(),
    discovery_notes: notes,
    crm_stage: stage,
    status: legacyLeadStatus(stage),
    next_follow_up_at: nextFollowUp,
    stage_updated_at: now.toISOString(),
    lost_reason: stage === "lost" ? lostReason : null,
    lost_at: stage === "lost" ? now.toISOString() : null
  }).eq("id", leadId);
  if (error) return fail(error.message || "Could not save the discovery outcome.");

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: `discovery_${stage}`,
    description: `Discovery completed: ${stage.replaceAll("_", " ")}`,
    actorId: user.id,
    metadata: { previous_stage: lead.crm_stage || null, notes, lost_reason: stage === "lost" ? lostReason : null }
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (lead.job_id) revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}discovery_completed=1`);
}

export async function updateLeadStatusAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "");
  const status = String(formData.get("status") || "");
  if (!leadId || !["new", "converted", "archived"].includes(status)) throw new Error("Choose a valid lead status.");

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("lead_intake")
    .select("id,status,crm_stage,job_id,session_id,page_url,service,lost_reason")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) throw new Error("Lead not found.");
  if (lead.status === status) return;

  const crmStage: LeadCrmStage = status === "converted" ? "qualified" : status === "archived" ? "lost" : "new";
  const now = new Date().toISOString();
  const { error } = await admin.from("lead_intake").update({
    status,
    crm_stage: crmStage,
    stage_updated_at: now,
    next_follow_up_at: status === "archived" ? null : undefined,
    lost_reason: status === "archived" ? (lead.lost_reason || "Archived from legacy lead inbox") : null,
    lost_at: status === "archived" ? now : null,
    won_at: null
  }).eq("id", leadId);
  if (error) throw error;

  const labels: Record<string, string> = {
    new: "Lead reopened for follow-up",
    converted: "Lead marked qualified",
    archived: "Lead archived"
  };
  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: `lead_status_${status}`,
    description: labels[status],
    actorId: user.id,
    metadata: { previous_status: lead.status, previous_stage: lead.crm_stage || null, job_id: lead.job_id || null }
  });

  if (status === "converted") {
    let path = "/hire";
    try {
      if (lead.page_url) path = new URL(lead.page_url).pathname;
    } catch {}
    await admin.from("analytics_events").insert({
      event_name: "qualified_lead",
      path,
      session_id: lead.session_id || null,
      metadata: { lead_id: leadId, job_id: lead.job_id || null, service: lead.service || null }
    });
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (lead.job_id) revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
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
