"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRoleFast, requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

function text(value: FormDataEntryValue | null, max = 500) {
  return String(value || "").trim().slice(0, max) || null;
}

function safeRecruiterReturn(value: FormDataEntryValue | null) {
  const raw = String(value || "/workspace/recruiter/work-readiness");
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/workspace/recruiter/work-readiness";
}

function workSetupComplete(va: any) {
  return Boolean(
    va.work_setup_computer && va.work_setup_os && va.work_setup_ram_gb && va.primary_internet &&
    va.backup_internet && va.backup_power && va.headset_ready && va.webcam_ready &&
    va.quiet_workspace && va.work_setup_submitted_at
  );
}

export async function saveVaWorkSetupAction(formData: FormData) {
  const { userId } = await requireRoleFast("va");
  const admin = createAdminClient();
  const ram = Number(formData.get("work_setup_ram_gb") || 0);
  const computer = text(formData.get("work_setup_computer"));
  const os = text(formData.get("work_setup_os"));
  const primaryInternet = text(formData.get("primary_internet"));
  const backupInternet = text(formData.get("backup_internet"));
  const backupPower = text(formData.get("backup_power"));

  if (!computer || !os || !primaryInternet || !backupInternet || !backupPower) {
    throw new Error("Complete the computer, internet, and backup setup fields.");
  }
  if (!Number.isInteger(ram) || ram < 4 || ram > 256) throw new Error("Enter RAM between 4 GB and 256 GB.");

  const now = new Date().toISOString();
  const { error } = await admin.from("va_profiles").update({
    work_setup_computer: computer,
    work_setup_os: os,
    work_setup_ram_gb: ram,
    primary_internet: primaryInternet,
    backup_internet: backupInternet,
    backup_power: backupPower,
    headset_ready: formData.get("headset_ready") === "on",
    webcam_ready: formData.get("webcam_ready") === "on",
    quiet_workspace: formData.get("quiet_workspace") === "on",
    work_setup_submitted_at: now,
    work_setup_verified_at: null,
    work_setup_verified_by: null,
    work_setup_verification_notes: null
  }).eq("user_id", userId);
  if (error) throw error;

  await writeRecruiterActivity({
    subjectType: "va",
    subjectId: userId,
    action: "work_setup_submitted",
    description: "VA updated private work-readiness evidence for recruiter verification",
    actorId: userId
  });
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/va/work-readiness");
  revalidatePath("/workspace/recruiter/work-readiness");
  redirect("/workspace/va/work-readiness?saved=1");
}

export async function verifyVaWorkSetupAction(formData: FormData) {
  const { userId } = await requireAnyRoleFast(["recruiter", "admin"]);
  const vaId = String(formData.get("va_id") || "");
  const safeReturn = safeRecruiterReturn(formData.get("return_to"));
  if (!vaId) throw new Error("VA is required.");

  const admin = createAdminClient();
  const { data: va, error: loadError } = await admin.from("va_profiles").select("work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at").eq("user_id", vaId).maybeSingle();
  if (loadError || !va) throw loadError || new Error("VA profile not found.");
  const complete = workSetupComplete(va);
  if (!complete) throw new Error("The VA must complete the full work-readiness setup before verification.");

  const now = new Date().toISOString();
  const notes = text(formData.get("verification_notes"), 2000);
  const { error } = await admin.from("va_profiles").update({
    work_setup_verified_at: now,
    work_setup_verified_by: userId,
    work_setup_verification_notes: notes
  }).eq("user_id", vaId);
  if (error) throw error;

  await writeRecruiterActivity({
    subjectType: "va",
    subjectId: vaId,
    action: "work_setup_verified",
    description: "Recruiter verified the VA work setup",
    actorId: userId
  });
  revalidatePath("/workspace/recruiter/work-readiness");
  revalidatePath("/workspace/recruiter/talent");
  revalidatePath("/workspace/client/team");
  redirect(`${safeReturn}${safeReturn.includes("?") ? "&" : "?"}work_setup_verified=1`);
}


export async function bulkWorkReadinessAction(formData: FormData) {
  const { userId } = await requireAnyRoleFast(["recruiter", "admin"]);
  const action = String(formData.get("bulk_action") || "");
  const returnTo = safeRecruiterReturn(formData.get("return_to"));
  const ids = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))];
  if (!["verify", "remind"].includes(action)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=Choose%20a%20bulk%20action`);
  }
  if (!ids.length) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=Select%20at%20least%20one%20VA`);
  }
  if (ids.length > 100) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}bulk_error=Bulk%20actions%20are%20limited%20to%20100%20VAs%20at%20a%20time`);
  }

  const admin = createAdminClient();
  const { data: setupRows, error } = await admin.from("va_profiles")
    .select("user_id,work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at,work_setup_verified_at")
    .in("user_id", ids);
  if (error) throw error;

  const rows = setupRows || [];
  let affected = 0;
  let skipped = Math.max(0, ids.length - rows.length);
  const now = new Date().toISOString();

  if (action === "verify") {
    const eligible = rows.filter((row: any) => !row.work_setup_verified_at && workSetupComplete(row)).map((row: any) => row.user_id);
    skipped += rows.length - eligible.length;
    if (eligible.length) {
      const { error: updateError } = await admin.from("va_profiles").update({
        work_setup_verified_at: now,
        work_setup_verified_by: userId,
        work_setup_verification_notes: "Bulk verified from recruiter Work Readiness queue."
      }).in("user_id", eligible);
      if (updateError) throw updateError;
      affected = eligible.length;
      await Promise.all(eligible.map((vaId: string) => writeRecruiterActivity({
        subjectType: "va",
        subjectId: vaId,
        action: "work_setup_verified",
        description: "Recruiter bulk-verified the VA work setup",
        actorId: userId
      })));
    }
  } else {
    const incomplete = rows.filter((row: any) => !row.work_setup_verified_at && !workSetupComplete(row)).map((row: any) => row.user_id);
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recent } = incomplete.length
      ? await admin.from("notifications").select("user_id").eq("type", "work_setup_incomplete").gte("created_at", cutoff).in("user_id", incomplete)
      : { data: [] as any[] };
    const recentlyReminded = new Set((recent || []).map((row: any) => row.user_id));
    const eligible = incomplete.filter((id: string) => !recentlyReminded.has(id));
    skipped += rows.length - eligible.length;
    if (eligible.length) {
      const { error: notificationError } = await admin.from("notifications").insert(eligible.map((vaId: string) => ({
        user_id: vaId,
        type: "work_setup_incomplete",
        title: "Complete your work readiness setup",
        body: "Your recruiter is waiting for the remaining computer, internet, backup, or workspace details before work readiness can be verified.",
        href: "/workspace/va/work-readiness"
      })));
      if (notificationError) throw notificationError;
      affected = eligible.length;
      await Promise.all(eligible.map((vaId: string) => writeRecruiterActivity({
        subjectType: "va",
        subjectId: vaId,
        action: "work_setup_reminder_sent",
        description: "Recruiter sent an in-app work-readiness reminder",
        actorId: userId
      })));
    }
  }

  revalidatePath("/workspace/recruiter/work-readiness");
  revalidatePath("/workspace/recruiter/talent");
  const params = new URLSearchParams({ bulk_done: action, affected: String(affected), skipped: String(skipped) });
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`);
}
