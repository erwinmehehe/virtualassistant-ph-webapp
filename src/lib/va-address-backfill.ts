import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractResumeAddressCandidate, extractResumeText } from "@/lib/resume-parsing";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function mimeFromPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".pdf")) return PDF_MIME;
  if (lower.endsWith(".docx")) return DOCX_MIME;
  return null;
}

export async function runVaAddressResumeBackfill(limit = 8) {
  const admin = createAdminClient();
  const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));

  const { data: candidates, error } = await admin
    .from("va_profiles")
    .select("user_id,resume_path,address,address_resume_checked_at")
    .not("resume_path", "is", null)
    .is("address_resume_checked_at", null)
    .limit(safeLimit * 3);
  if (error) throw error;

  const rows = (candidates || [])
    .filter((row) => !String(row.address || "").trim() && String(row.resume_path || "").trim())
    .slice(0, safeLimit);

  let saved = 0;
  let review = 0;
  let noMatch = 0;
  let unsupported = 0;
  let errors = 0;

  for (const row of rows) {
    const resumePath = String(row.resume_path || "");
    const mimeType = mimeFromPath(resumePath);
    const checkedAt = new Date().toISOString();

    if (!mimeType) {
      await admin
        .from("va_profiles")
        .update({ address_resume_status: "unsupported", address_resume_checked_at: checkedAt })
        .eq("user_id", row.user_id);
      unsupported++;
      continue;
    }

    try {
      const { data: file, error: downloadError } = await admin.storage.from("resumes").download(resumePath);
      if (downloadError || !file) throw downloadError || new Error("Resume download failed.");

      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await Promise.race([
        extractResumeText(buffer, mimeType),
        new Promise<never>((_, reject) => {
          const timeout = setTimeout(() => reject(new Error("Resume parsing timed out.")), 8_000);
          timeout.unref?.();
        }),
      ]);
      const candidate = extractResumeAddressCandidate(text);

      if (candidate.confidence === "high" && candidate.address) {
        const { error: saveError } = await admin
          .from("va_profiles")
          .update({
            address: candidate.address,
            address_resume_status: "saved",
            address_resume_checked_at: checkedAt,
          })
          .eq("user_id", row.user_id)
          .or("address.is.null,address.eq.");
        if (saveError) throw saveError;
        saved++;
      } else {
        const status = candidate.confidence === "review" ? "review" : "no_match";
        const { error: statusError } = await admin
          .from("va_profiles")
          .update({ address_resume_status: status, address_resume_checked_at: checkedAt })
          .eq("user_id", row.user_id);
        if (statusError) throw statusError;
        if (status === "review") review++;
        else noMatch++;
      }
    } catch (backfillError) {
      console.error("[va-address-backfill] resume processing failed", {
        vaId: row.user_id,
        message: backfillError instanceof Error ? backfillError.message : "unknown",
      });
      await admin
        .from("va_profiles")
        .update({ address_resume_status: "error", address_resume_checked_at: checkedAt })
        .eq("user_id", row.user_id);
      errors++;
    }
  }

  const { count: remaining } = await admin
    .from("va_profiles")
    .select("user_id", { count: "exact", head: true })
    .not("resume_path", "is", null)
    .is("address_resume_checked_at", null)
    .or("address.is.null,address.eq.");

  return {
    checked: rows.length,
    saved,
    review,
    noMatch,
    unsupported,
    errors,
    remaining: Number(remaining || 0),
  };
}
