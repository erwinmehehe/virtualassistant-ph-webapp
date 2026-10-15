"use server";

import { requireRole } from "@/lib/auth";
import { extractResumeText, parseResumeWithAI, type ParsedResumeFields } from "@/lib/resume-parsing";
import { validateUpload } from "@/lib/file-security";

export type ParseResumeState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: ParsedResumeFields;
};

/**
 * Parses an uploaded resume and returns suggested profile fields for the
 * client to review and apply -- this never writes to the database itself.
 * The actual save still goes through updateVaProfileAction when the VA
 * submits the main profile form, same as always.
 */
export async function parseResumeAction(_previousState: ParseResumeState, formData: FormData): Promise<ParseResumeState> {
  await requireRole("va");

  const file = formData.get("resume_for_autofill");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a resume file first." };
  }
  let validated;
  try {
    validated = await validateUpload(file, "resume");
  } catch {
    return {
      status: "error",
      message: "Auto-fill only accepts a genuine PDF or DOCX file whose contents match its file name.",
    };
  }

  if (!validated) {
    return { status: "error", message: "Choose a resume file first." };
  }
  if (validated.extension === "doc") {
    return {
      status: "error",
      message: "Your DOC resume can still be saved with the profile, but auto-fill needs a PDF or DOCX file."
    };
  }

  const resumeType = validated.contentType;
  try {
    const buffer = validated.buffer;
    const text = await Promise.race([
      extractResumeText(buffer, resumeType),
      new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => reject(new Error("Resume parsing exceeded the safe processing time.")), 8_000);
        timeout.unref?.();
      }),
    ]);
    if (!text.trim()) {
      return { status: "error", message: "No readable text was found. If the PDF is scanned or image-only, export a text-based PDF or DOCX and try again." };
    }

    const fields = await parseResumeWithAI(text);
    const gotAnything = Boolean(fields.address || fields.headline || fields.bio || fields.skills.length || fields.tools.length || fields.years_experience != null || fields.primary_category);
    if (!gotAnything) {
      return { status: "error", message: "We couldn't confidently pull details from this resume. Please fill the form in manually." };
    }

    return { status: "success", fields };
  } catch (err) {
    console.error("[resume-autofill] resume parsing failed", {
      type: resumeType,
      message: err instanceof Error ? err.message : "unknown",
    });
    return {
      status: "error",
      message: "We couldn't read this resume. Try exporting it again as a text-based PDF or DOCX, then retry.",
    };
  }
}
