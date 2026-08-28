"use server";

import { requireRole } from "@/lib/auth";
import { extractResumeText, parseResumeWithAI, type ParsedResumeFields } from "@/lib/resume-parsing";

export type ParseResumeState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: ParsedResumeFields;
};

const initialState: ParseResumeState = { status: "idle" };
export { initialState as parseResumeInitialState };

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

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
  if (file.size > 5 * 1024 * 1024) {
    return { status: "error", message: "Resume must be 5 MB or smaller." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { status: "error", message: "Auto-fill supports PDF and DOCX only. You can still upload a DOC resume below and fill the form manually." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractResumeText(buffer, file.type);
    if (!text.trim()) {
      return { status: "error", message: "Could not read any text from this file. Try a different export of your resume." };
    }

    const fields = await parseResumeWithAI(text);
    const gotAnything = Boolean(fields.headline || fields.bio || fields.skills.length || fields.tools.length || fields.years_experience != null || fields.primary_category);
    if (!gotAnything) {
      return { status: "error", message: "We couldn't confidently pull details from this resume. Please fill the form in manually." };
    }

    return { status: "success", fields };
  } catch (err) {
    return { status: "error", message: (err as Error).message || "Could not process this resume. Please fill the form in manually." };
  }
}
