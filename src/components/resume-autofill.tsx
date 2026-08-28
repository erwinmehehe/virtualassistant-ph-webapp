"use client";

import { useActionState, useRef } from "react";
import { Sparkles, UploadCloud } from "lucide-react";
import { parseResumeAction, parseResumeInitialState, type ParseResumeState } from "@/app/actions/resume-autofill";

/**
 * Uploads a resume, sends it to the server for AI extraction, then fills in
 * the named fields of the main profile form (identified by formId) so the
 * VA can review everything before saving. Nothing is submitted or persisted
 * by this component itself -- it only populates form field values.
 */
export function ResumeAutoFill({ formId }: { formId: string }) {
  const [state, formAction, pending] = useActionState<ParseResumeState, FormData>(
    async (prevState, formData) => {
      const result = await parseResumeAction(prevState, formData);
      if (result.status === "success" && result.fields) applyFieldsToForm(formId, result.fields);
      return result;
    },
    parseResumeInitialState
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function applyFieldsToForm(id: string, fields: NonNullable<ParseResumeState["fields"]>) {
    const form = document.getElementById(id) as HTMLFormElement | null;
    if (!form) return;
    const setValue = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (el && value) el.value = value;
    };
    if (fields.headline) setValue("headline", fields.headline);
    if (fields.bio) setValue("bio", fields.bio);
    if (fields.primary_category) setValue("primary_category", fields.primary_category);
    if (fields.categories.length) setValue("categories", fields.categories.join(", "));
    if (fields.skills.length) setValue("skills", fields.skills.join(", "));
    if (fields.tools.length) setValue("tools", fields.tools.join(", "));
    if (fields.industries.length) setValue("industries", fields.industries.join(", "));
    if (fields.languages.length) setValue("languages", fields.languages.join(", "));
    if (fields.years_experience != null) setValue("years_experience", String(fields.years_experience));
    // Trigger input events so anything watching field changes (e.g. live
    // profile-strength meter) picks up the new values.
    ["headline", "bio", "primary_category", "categories", "skills", "tools", "industries", "languages", "years_experience"].forEach((name) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (el) el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  return (
    <div className="card resume-autofill-card">
      <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
        <Sparkles size={20} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>Auto-fill from your resume</strong>
          <p className="small muted" style={{ margin: "3px 0 0" }}>Upload a PDF or DOCX resume and we'll suggest a specialty, skills, tools, and years of experience below for you to review before saving.</p>
        </div>
      </div>
      <form action={formAction} className="row wrap" style={{ marginTop: 12, gap: 10 }}>
        <input ref={fileInputRef} type="file" name="resume_for_autofill" accept=".pdf,.docx" required style={{ flex: 1, minWidth: 200 }} />
        <button className="btn btn-sm" type="submit" disabled={pending}>
          {pending ? "Reading resume..." : <><UploadCloud size={15} /> Auto-fill</>}
        </button>
      </form>
      {state.status === "error" ? <div className="alert" style={{ marginTop: 10 }} role="alert">{state.message}</div> : null}
      {state.status === "success" ? <div className="alert alert-success" style={{ marginTop: 10 }}>Filled in the fields below from your resume. Review and edit anything before saving.</div> : null}
    </div>
  );
}
