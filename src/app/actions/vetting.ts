"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVaCompletion } from "@/lib/profile-completeness";
import { scorecardTotal } from "@/lib/vetting";
import { VETTING_PROFILE_MIN, VETTING_SCORECARD_PASS, VETTING_TEST_PASS } from "@/lib/constants";

function cleanUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const url = new URL(raw);
  if (!['http:','https:'].includes(url.protocol)) throw new Error("Use a valid http or https URL.");
  return raw;
}

async function getCurrentCategoryAttempt(admin: ReturnType<typeof createAdminClient>, vaId: string, category?: string | null) {
  if (!category) return { test: null, attempt: null };
  const { data: test } = await admin.from("skills_tests").select("id,passing_score").eq("category", category).eq("active", true).maybeSingle();
  if (!test) return { test: null, attempt: null };
  const { data: attempt } = await admin.from("va_test_attempts").select("final_score,auto_score,submitted_at").eq("va_id", vaId).eq("test_id", test.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  return { test, attempt };
}

async function refreshStage(vaId: string) {
  const admin = createAdminClient();
  const [{data:profile},{data:accountProfile},{data:vetting},{data:scorecard}] = await Promise.all([
    admin.from("va_profiles").select("*").eq("user_id",vaId).single(),
    admin.from("profiles").select("avatar_url").eq("id",vaId).single(),
    admin.from("va_vetting").select("*").eq("va_id",vaId).single(),
    admin.from("vetting_scorecards").select("total_score,recommendation").eq("va_id",vaId).order("created_at",{ascending:false}).limit(1).maybeSingle()
  ]);
  if (!profile || !vetting || ["approved","bench","rejected","finalist"].includes(vetting.stage)) return;
  const { test, attempt } = await getCurrentCategoryAttempt(admin, vaId, profile.primary_category);
  const completion = getVaCompletion(profile, accountProfile?.avatar_url).score;
  const profileReady = completion >= VETTING_PROFILE_MIN && Boolean(profile.resume_path);
  const testScore = attempt?.final_score ?? attempt?.auto_score ?? null;
  const passingScore = test?.passing_score ?? VETTING_TEST_PASS;
  let stage = "profile";
  if (profileReady) stage = "test";
  if (profileReady && typeof testScore === "number" && testScore >= passingScore) stage = "video";
  if (profileReady && typeof testScore === "number" && testScore >= passingScore && vetting.video_url) stage = "recruiter_review";
  if (scorecard?.recommendation === "finalist") stage = "finalist";
  await admin.from("va_vetting").update({stage}).eq("va_id",vaId);
}

export async function submitVettingVideoAction(formData: FormData) {
  const {user} = await requireRole("va");
  const videoUrl = cleanUrl(formData.get("video_url"));
  if (!videoUrl) throw new Error("Add your 2-minute video introduction URL.");
  const admin = createAdminClient();
  const { data: va } = await admin.from("va_profiles").select("primary_category").eq("user_id", user.id).single();
  const { test, attempt } = await getCurrentCategoryAttempt(admin, user.id, va?.primary_category);
  const testScore = attempt?.final_score ?? attempt?.auto_score ?? null;
  if (typeof testScore !== "number" || testScore < (test?.passing_score ?? VETTING_TEST_PASS)) throw new Error("Pass your current category skills test before submitting the video introduction.");
  await admin.from("va_vetting").upsert({
    va_id:user.id,
    video_url:videoUrl,
    video_submitted_at:new Date().toISOString()
  },{onConflict:"va_id"});
  await refreshStage(user.id);
  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/vetting");
}

export async function submitSkillsTestAction(formData: FormData) {
  const {user} = await requireRole("va");
  const admin = createAdminClient();
  const [{data:va},{data:accountProfile}] = await Promise.all([admin.from("va_profiles").select("*").eq("user_id",user.id).single(), admin.from("profiles").select("avatar_url").eq("id",user.id).single()]);
  if (!va?.primary_category) throw new Error("Choose a primary VA category before taking a skills test.");
  const completion = getVaCompletion(va, accountProfile?.avatar_url).score;
  if (completion < VETTING_PROFILE_MIN || !va.resume_path) throw new Error(`Complete at least ${VETTING_PROFILE_MIN}% of your structured profile and upload your resume before taking the skills test.`);
  const {data:test} = await admin.from("skills_tests").select("*").eq("category",va.primary_category).eq("active",true).single();
  if (!test) throw new Error("No active skills test is configured for this category yet.");
  const questions = Array.isArray(test.questions) ? test.questions : [];
  const answers: Record<string,string> = {};
  let correct = 0;
  let scored = 0;
  for (const q of questions) {
    const id = String(q.id || "");
    if (!id) continue;
    const answer = String(formData.get(`q_${id}`) ?? "").trim();
    answers[id] = answer;
    if (q.type === "choice" && q.correct) {
      scored += 1;
      if (answer === q.correct) correct += 1;
    }
  }
  if (!questions.every((q:any) => String(answers[String(q.id)] || "").trim())) throw new Error("Complete every test question before submitting.");
  const autoScore = scored ? Math.round((correct / scored) * 100) : 0;
  await admin.from("va_test_attempts").upsert({
    test_id:test.id,
    va_id:user.id,
    answers,
    auto_score:autoScore,
    final_score:autoScore,
    submitted_at:new Date().toISOString(),
    reviewer_id:null,
    reviewer_score:null,
    review_notes:null,
    reviewed_at:null
  },{onConflict:"test_id,va_id"});
  await refreshStage(user.id);
  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/vetting");
}

export async function claimCandidateAction(formData: FormData) {
  const {user} = await requireRole("recruiter");
  const vaId = String(formData.get("va_id") ?? "");
  const admin = createAdminClient();
  const {data:vetting} = await admin.from("va_vetting").select("stage,recruiter_id").eq("va_id",vaId).single();
  if (!vetting || vetting.stage !== "recruiter_review") throw new Error("This candidate is not ready for recruiter review.");
  if (vetting.recruiter_id && vetting.recruiter_id !== user.id) throw new Error("This candidate is already assigned to another recruiter.");
  await admin.from("va_vetting").update({recruiter_id:user.id}).eq("va_id",vaId);
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/queue");
  revalidatePath(`/workspace/recruiter/candidates/${vaId}`);
}

export async function submitScorecardAction(formData: FormData) {
  const {user} = await requireRole("recruiter");
  const vaId = String(formData.get("va_id") ?? "");
  const admin = createAdminClient();
  const [{data:vetting},{data:va}] = await Promise.all([
    admin.from("va_vetting").select("stage,recruiter_id,video_url").eq("va_id",vaId).single(),
    admin.from("va_profiles").select("primary_category").eq("user_id",vaId).single()
  ]);
  if (!vetting || vetting.stage !== "recruiter_review") throw new Error("This candidate is not ready for a recruiter scorecard.");
  if (!vetting.video_url) throw new Error("The candidate must submit the required video introduction first.");
  if (vetting.recruiter_id && vetting.recruiter_id !== user.id) throw new Error("This candidate is assigned to another recruiter.");
  const { test, attempt } = await getCurrentCategoryAttempt(admin, vaId, va?.primary_category);
  const testScore = attempt?.final_score ?? attempt?.auto_score ?? null;
  if (typeof testScore !== "number" || testScore < (test?.passing_score ?? VETTING_TEST_PASS)) throw new Error("The candidate must pass the current category skills test before recruiter review.");
  const fields = ["role_skills","communication","judgment","reliability","client_readiness"] as const;
  const scores = fields.map((key) => Number(formData.get(key)));
  if (scores.some((n) => !Number.isInteger(n) || n < 1 || n > 5)) throw new Error("Every scorecard item must be rated from 1 to 5.");
  const recommendation = String(formData.get("recommendation") ?? "hold");
  if (!["reject","hold","finalist"].includes(recommendation)) throw new Error("Invalid recommendation.");
  const total = scorecardTotal(scores);
  if (formData.get("interview_completed") !== "on") throw new Error("Confirm the first-pass recruiter interview before saving the scorecard.");
  if (recommendation === "finalist" && total < VETTING_SCORECARD_PASS) throw new Error(`Finalists must score at least ${VETTING_SCORECARD_PASS}% on the recruiter scorecard.`);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  await admin.from("vetting_scorecards").insert({
    va_id:vaId, reviewer_id:user.id, role_skills:scores[0], communication:scores[1], judgment:scores[2], reliability:scores[3], client_readiness:scores[4], total_score:total, recommendation, notes
  });
  await admin.from("va_vetting").upsert({
    va_id:vaId,
    recruiter_id:user.id,
    recruiter_notes:notes,
    recruiter_interview_at:new Date().toISOString(),
    stage:recommendation === "finalist" ? "finalist" : recommendation === "reject" ? "rejected" : "recruiter_review",
    rejected_at: recommendation === "reject" ? new Date().toISOString() : null
  },{onConflict:"va_id"});
  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/queue");
  revalidatePath(`/workspace/recruiter/candidates/${vaId}`);
  revalidatePath("/workspace/admin/vetting");
}

export async function reviewFinalistAction(formData: FormData) {
  await requireRole("admin");
  const vaId = String(formData.get("va_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!["approve","reject","return"].includes(decision)) throw new Error("Invalid final review decision.");
  if (!notes || notes.length < 20) throw new Error("Add a final review note of at least 20 characters before deciding.");
  const admin = createAdminClient();
  const [{data:vetting},{data:scorecard}] = await Promise.all([
    admin.from("va_vetting").select("stage,recruiter_interview_at").eq("va_id",vaId).single(),
    admin.from("vetting_scorecards").select("total_score,recommendation").eq("va_id",vaId).order("created_at",{ascending:false}).limit(1).maybeSingle()
  ]);
  if (!vetting || vetting.stage !== "finalist") throw new Error("Only recruiter finalists can enter final review.");
  if (!vetting.recruiter_interview_at || !scorecard || scorecard.recommendation !== "finalist" || scorecard.total_score < VETTING_SCORECARD_PASS) throw new Error("This finalist has not completed the required recruiter interview and score threshold.");
  if (decision === "approve") {
    await admin.from("va_vetting").update({stage:"approved",approved_at:new Date().toISOString(),rejected_at:null,admin_notes:notes}).eq("va_id",vaId);
  } else if (decision === "reject") {
    await admin.from("va_vetting").update({stage:"rejected",rejected_at:new Date().toISOString(),admin_notes:notes}).eq("va_id",vaId);
  } else {
    await admin.from("va_vetting").update({stage:"recruiter_review",admin_notes:notes}).eq("va_id",vaId);
  }
  revalidatePath("/workspace/admin/vetting");
  revalidatePath(`/workspace/admin/vetting/${vaId}`);
  revalidatePath("/find-talent");
}

export async function addBenchMemberAction(formData: FormData) {
  const {user} = await requireAnyRole(["recruiter","admin"]);
  const vaId = String(formData.get("va_id") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const priority = Math.min(5,Math.max(1,Number(formData.get("priority") ?? 3)));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!category) throw new Error("Choose a bench category.");
  const admin = createAdminClient();
  const {data:vetting} = await admin.from("va_vetting").select("stage").eq("va_id",vaId).single();
  if (!vetting || !["approved","bench"].includes(vetting.stage)) throw new Error("Only approved VAs can be added to the active talent pool.");
  await admin.from("bench_memberships").upsert({va_id:vaId,category,status:"active",priority,notes,created_by:user.id},{onConflict:"va_id,category"});
  await admin.from("va_vetting").update({stage:"bench"}).eq("va_id",vaId);
  revalidatePath("/workspace/recruiter/bench");
  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/find-talent");
}

export async function updateBenchMemberAction(formData: FormData) {
  await requireAnyRole(["recruiter","admin"]);
  const id = String(formData.get("membership_id") ?? "");
  const status = String(formData.get("status") ?? "active");
  if (!["active","paused"].includes(status)) throw new Error("Invalid bench status.");
  const admin = createAdminClient();
  await admin.from("bench_memberships").update({status}).eq("id",id);
  revalidatePath("/workspace/recruiter/bench");
}

export async function assignRecruiterAction(formData: FormData) {
  await requireRole("admin");
  const vaId = String(formData.get("va_id") ?? "");
  const recruiterId = String(formData.get("recruiter_id") ?? "").trim() || null;
  const admin = createAdminClient();
  await admin.from("va_vetting").upsert({va_id:vaId,recruiter_id:recruiterId},{onConflict:"va_id"});
  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/workspace/recruiter/queue");
}

export async function setInternalUserRoleAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!["va","client","recruiter"].includes(role)) throw new Error("Unsupported account role.");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  await admin.from("profiles").update({role}).eq("id",userId);
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  if (authUser.user) {
    await admin.auth.admin.updateUserById(userId, { app_metadata: { ...(authUser.user.app_metadata || {}), role } });
  }
  if (role === "va") {
    await admin.from("va_profiles").upsert({user_id:userId,slug:`va-${userId.slice(0,8)}`},{onConflict:"user_id"});
    await admin.from("va_vetting").upsert({va_id:userId},{onConflict:"va_id"});
  }
  if (role === "client") await admin.from("client_profiles").upsert({user_id:userId},{onConflict:"user_id"});
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: "user_role_changed", targetType: "user", targetId: userId, metadata: { from: previous?.role || null, to: role } });
  revalidatePath("/workspace/admin/users");
}

export async function setIdentityVerificationAction(formData: FormData) {
  const { user } = await requireRole("admin");
  const userId = String(formData.get("user_id") ?? "");
  const verified = String(formData.get("verified") ?? "") === "1";
  if (!userId) throw new Error("Missing user.");
  const admin = createAdminClient();
  await admin.from("profiles").update({ identity_verified_at: verified ? new Date().toISOString() : null }).eq("id", userId).eq("role", "va");
  const { writeAdminAudit } = await import("@/lib/admin-audit");
  await writeAdminAudit({ actorId: user.id, action: verified ? "identity_verified" : "identity_verification_removed", targetType: "user", targetId: userId });
  revalidatePath("/workspace/admin/users");
  revalidatePath("/find-talent");
}
