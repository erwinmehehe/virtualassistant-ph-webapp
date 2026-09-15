"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

function text(value: FormDataEntryValue | null, max = 500) {
  return String(value || "").trim().slice(0, max) || null;
}

export async function saveVaWorkSetupAction(formData: FormData) {
  const { user } = await requireRole("va");
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
  }).eq("user_id", user.id);
  if (error) throw error;

  await writeRecruiterActivity({
    subjectType: "va",
    subjectId: user.id,
    action: "work_setup_submitted",
    description: "VA updated private work-readiness evidence for recruiter verification",
    actorId: user.id
  });
  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/recruiter/work-readiness");
  redirect("/workspace/va/profile?work_setup_saved=1#work-readiness");
}

export async function verifyVaWorkSetupAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const vaId = String(formData.get("va_id") || "");
  const returnTo = String(formData.get("return_to") || "/workspace/recruiter/work-readiness");
  const safeReturn = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/workspace/recruiter/work-readiness";
  if (!vaId) throw new Error("VA is required.");

  const admin = createAdminClient();
  const { data: va, error: loadError } = await admin.from("va_profiles").select("work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at").eq("user_id", vaId).maybeSingle();
  if (loadError || !va) throw loadError || new Error("VA profile not found.");
  const complete = Boolean(
    va.work_setup_computer && va.work_setup_os && va.work_setup_ram_gb && va.primary_internet &&
    va.backup_internet && va.backup_power && va.headset_ready && va.webcam_ready && va.quiet_workspace && va.work_setup_submitted_at
  );
  if (!complete) throw new Error("The VA must complete the full work-readiness setup before verification.");

  const now = new Date().toISOString();
  const notes = text(formData.get("verification_notes"), 2000);
  const { error } = await admin.from("va_profiles").update({
    work_setup_verified_at: now,
    work_setup_verified_by: user.id,
    work_setup_verification_notes: notes
  }).eq("user_id", vaId);
  if (error) throw error;

  await writeRecruiterActivity({
    subjectType: "va",
    subjectId: vaId,
    action: "work_setup_verified",
    description: "Recruiter verified the VA work setup",
    actorId: user.id
  });
  revalidatePath("/workspace/recruiter/work-readiness");
  revalidatePath("/workspace/recruiter/talent");
  revalidatePath("/workspace/client/team");
  redirect(`${safeReturn}${safeReturn.includes("?") ? "&" : "?"}work_setup_verified=1`);
}
