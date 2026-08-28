"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked, type CandidateAccessStatus } from "@/lib/candidate-access";
import { matchAssessment } from "@/lib/matching";
import { recordProductEvent } from "@/lib/product-events";

const ACCESS_STATUSES: CandidateAccessStatus[] = ["locked", "requested", "quoted", "invoiced", "paid", "comped"];

function safeReturnTo(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function notifyAdmins(title: string, body: string, href: string) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (!admins?.length) return;
  await admin.from("notifications").insert(admins.map((row: any) => ({ user_id: row.id, title, body, href })));
}

export async function requestCandidateAccessAction(formData: FormData) {
  const { user } = await requireRole("client");
  const jobId = String(formData.get("job_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/client/jobs/${jobId}`);
  if (!jobId) throw new Error("Job is required.");

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id,title,client_id").eq("id", jobId).eq("client_id", user.id).single();
  if (!job) throw new Error("Job not found.");

  const { data: current } = await admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle();
  if (!candidateAccessUnlocked(current?.access_status) && !["quoted", "invoiced"].includes(current?.access_status || "")) {
    const now = new Date().toISOString();
    await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "requested",
      requested_at: now
    }, { onConflict: "job_id" });
    await notifyAdmins("Candidate access requested", `A client requested access to applicant and shortlist details for ${job.title}.`, `/workspace/admin/jobs/${jobId}`);
    await recordProductEvent("candidate_unlock_initiated", { userId: user.id, path: returnTo, metadata: { job_id: jobId } });
  }

  revalidatePath(returnTo);
  revalidatePath("/workspace/admin/jobs");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}access_requested=1`);
}

export async function updateCandidateAccessAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const jobId = String(formData.get("job_id") || "");
  const status = String(formData.get("access_status") || "locked") as CandidateAccessStatus;
  const feeRaw = String(formData.get("access_fee") || "").trim();
  const fee = feeRaw ? Number(feeRaw) : null;
  const paymentReference = String(formData.get("payment_reference") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!jobId || !ACCESS_STATUSES.includes(status)) throw new Error("Invalid candidate access update.");
  if (fee != null && (!Number.isFinite(fee) || fee < 0 || fee > 100000)) throw new Error("Enter a valid candidate access fee.");
  if (["quoted", "invoiced", "paid"].includes(status) && (fee == null || fee <= 0)) throw new Error("Set a candidate access fee before using a paid access status.");

  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("id,title,client_id").eq("id", jobId).single();
  if (!job) throw new Error("Job not found.");
  const active = candidateAccessUnlocked(status);
  const payload: Record<string, unknown> = {
    job_id: jobId,
    access_status: status,
    access_fee: status === "comped" && fee == null ? 0 : fee,
    currency: "USD",
    payment_reference: paymentReference,
    notes,
    unlocked_at: active ? new Date().toISOString() : null,
    unlocked_by: active ? user.id : null
  };
  if (status === "requested") payload.requested_at = new Date().toISOString();
  const { error } = await admin.from("job_candidate_access").upsert(payload, { onConflict: "job_id" });
  if (error) throw error;

  if (job.client_id) {
    const copy = active
      ? "Candidate details are now unlocked. You can review released shortlist profiles, applicants, resumes, and conversations."
      : status === "quoted"
        ? `Candidate access has been quoted at USD ${fee?.toFixed(2)}.`
        : status === "invoiced"
          ? `Candidate access is awaiting payment${paymentReference ? ` (${paymentReference})` : ""}.`
          : "Candidate access status was updated by the hiring team.";
    await admin.from("notifications").insert({ user_id: job.client_id, title: active ? "Candidate access unlocked" : "Candidate access updated", body: copy, href: `/workspace/client/jobs/${jobId}` });
  }

  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  revalidatePath("/workspace/client/candidates");
  revalidatePath("/workspace/client/messages");
}

export async function saveJobShortlistAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const mode = String(formData.get("mode") || "save");
  const selected = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))].slice(0, 50);
  const returnTo = safeReturnTo(formData.get("return_to"), profile.role === "recruiter" ? `/workspace/recruiter/matching/${jobId}` : `/workspace/admin/jobs/${jobId}`);

  // Expected, recoverable problems (nothing selected, job not linked to a
  // client yet, etc.) redirect back with a clear inline message instead of
  // throwing -- an uncaught throw here crashes to the generic Next.js error
  // boundary, which reads as "the site is broken" for something that's
  // really just "pick a candidate first" or "link a client account first."
  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}shortlist_error=${encodeURIComponent(message)}`);

  if (!jobId) return fail("Job is required.");
  if (!selected.length) return fail("Select at least one VA before saving or releasing a shortlist.");
  if (!["save", "release"].includes(mode)) return fail("Invalid shortlist action.");

  const admin = createAdminClient();
  const [{ data: job }, { data: vetting }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).single(),
    admin.from("va_vetting").select("va_id,stage").in("va_id", selected).in("stage", ["approved", "bench"])
  ]);
  if (!job) return fail("Job not found.");
  const approvedIds = new Set((vetting || []).map((row: any) => row.va_id));
  if (approvedIds.size !== selected.length) return fail("One or more selected VAs are no longer approved for matching.");
  if (mode === "release" && !job.client_id) return fail("This role has no linked client account yet (it's from an unlinked lead) -- link it to a client before releasing a shortlist. You can still save an internal shortlist.");

  const [{ data: vas }, { data: existing }] = await Promise.all([
    admin.from("va_profiles").select("*").in("user_id", selected),
    admin.from("job_shortlist_candidates").select("va_id,shortlist_status").eq("job_id", jobId)
  ]);
  const vaMap = new Map((vas || []).map((va: any) => [va.user_id, va]));
  const existingMap = new Map((existing || []).map((row: any) => [row.va_id, row.shortlist_status]));
  const now = new Date().toISOString();
  if (mode === "save") {
    const deselectedProposed = (existing || []).filter((row: any) => row.shortlist_status === "proposed" && !selected.includes(row.va_id)).map((row: any) => row.va_id);
    if (deselectedProposed.length) await admin.from("job_shortlist_candidates").update({ shortlist_status: "hidden", released_at: null }).eq("job_id", jobId).in("va_id", deselectedProposed);
  }
  const rows = selected.map((vaId) => {
    const va = vaMap.get(vaId) as any;
    if (!va) return fail("A selected VA profile could not be loaded. Refresh and try again.");
    const assessment = matchAssessment(job, va);
    const prior = existingMap.get(vaId);
    const status = mode === "release" ? "released" : prior === "released" ? "released" : "proposed";
    return {
      job_id: jobId,
      va_id: vaId,
      match_score: assessment.score,
      match_confidence: assessment.confidence,
      shortlist_status: status,
      created_by: user.id,
      released_at: status === "released" ? now : null
    };
  });
  const { error } = await admin.from("job_shortlist_candidates").upsert(rows, { onConflict: "job_id,va_id" });
  if (error) {
    console.error("saveJobShortlistAction upsert failed:", error);
    return fail("Could not save the shortlist. Please try again.");
  }

  if (mode === "release" && job.client_id) {
    const { data: access } = await admin.from("job_candidate_access").select("access_status").eq("job_id", jobId).maybeSingle();
    const unlocked = candidateAccessUnlocked(access?.access_status);
    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your curated shortlist is ready",
      body: unlocked
        ? `${selected.length} matched VA profile${selected.length === 1 ? " is" : "s are"} ready to review.`
        : `${selected.length} matched VA${selected.length === 1 ? " is" : "s are"} ready. Candidate identities stay protected until candidate access is activated.`,
      href: `/workspace/client/jobs/${jobId}`
    });
  }

  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${mode === "release" ? "shortlist_released" : "shortlist_saved"}=1`);
}

export async function hideShortlistCandidateAction(formData: FormData) {
  await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("remove_va_id") || formData.get("va_id") || "");
  const returnTo = safeReturnTo(formData.get("return_to"), `/workspace/admin/jobs/${jobId}`);
  if (!jobId || !vaId) throw new Error("Candidate and job are required.");
  const { error } = await createAdminClient().from("job_shortlist_candidates").update({ shortlist_status: "hidden", released_at: null }).eq("job_id", jobId).eq("va_id", vaId);
  if (error) throw error;
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  redirect(returnTo);
}
