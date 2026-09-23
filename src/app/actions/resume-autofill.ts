"use server";

import { requireRole } from "@/lib/auth";
import { extractResumeText, parseResumeWithAI, type ParsedResumeFields } from "@/lib/resume-parsing";

export type ParseResumeState = {
  status: "idle" | "success" | "error";
  message?: string;
  fields?: ParsedResumeFields;
};

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const GENERIC_MIME = new Set(["", "application/octet-stream"]);

function resolvedResumeType(file: File) {
  const name = file.name.toLowerCase();
  if (file.type === PDF_MIME || (GENERIC_MIME.has(file.type) && name.endsWith(".pdf"))) return PDF_MIME;
  if (file.type === DOCX_MIME || (GENERIC_MIME.has(file.type) && name.endsWith(".docx"))) return DOCX_MIME;
  return null;
}

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
  const resumeType = resolvedResumeType(file);
  if (!resumeType) {
    return { status: "error", message: "Auto-fill supports PDF and DOCX files. If this is a valid resume, export it again as PDF or DOCX and retry." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractResumeText(buffer, resumeType);
    if (!text.trim()) {
      return { status: "error", message: "No readable text was found. If the PDF is scanned or image-only, export a text-based PDF or DOCX and try again." };
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
