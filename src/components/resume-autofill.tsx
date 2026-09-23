"use client";

import { useActionState, useRef, useState } from "react";
import { CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { parseResumeAction, type ParseResumeState } from "@/app/actions/resume-autofill";
import { removeVaResumeAction } from "@/app/actions/profile";

const parseResumeInitialState: ParseResumeState = { status: "idle" };

export function ResumeAutoFill({
  formId,
  hasSavedResume = false,
  savedResumeName = null,
}: {
  formId: string;
  hasSavedResume?: boolean;
  savedResumeName?: string | null;
}) {
  const parseFileRef = useRef<HTMLInputElement>(null);
  const profileResumeRef = useRef<HTMLInputElement>(null);
  const [selectedName, setSelectedName] = useState("");

  function attachResumeToProfileForm(file: File) {
    const target = profileResumeRef.current;
    if (!target) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    target.files = transfer.files;
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setFormValue(
    form: HTMLFormElement,
    name: string,
    value: string,
  ) {
    const element = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    if (!element || !value) return;
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applyFieldsToForm(id: string, fields: NonNullable<ParseResumeState["fields"]>) {
    const form = document.getElementById(id) as HTMLFormElement | null;
    if (!form) return;

    if (fields.headline) setFormValue(form, "headline", fields.headline);
    if (fields.bio) setFormValue(form, "bio", fields.bio);
    if (fields.primary_category) setFormValue(form, "primary_category", fields.primary_category);
    if (fields.categories.length) setFormValue(form, "categories", fields.categories.join(", "));
    if (fields.skills.length) setFormValue(form, "skills", fields.skills.join(", "));
    if (fields.tools.length) setFormValue(form, "tools", fields.tools.join(", "));
    if (fields.industries.length) setFormValue(form, "industries", fields.industries.join(", "));
    if (fields.languages.length) setFormValue(form, "languages", fields.languages.join(", "));
    if (fields.years_experience != null) setFormValue(form, "years_experience", String(fields.years_experience));
  }

  const [state, formAction, pending] = useActionState<ParseResumeState, FormData>(
    async (_previousState, formData) => {
      const selected = formData.get("resume_for_autofill");
      if (selected instanceof File && selected.size > 0) {
        attachResumeToProfileForm(selected);
      }

      const result = await parseResumeAction(_previousState, formData);
      if (result.status === "success" && result.fields) {
        applyFieldsToForm(formId, result.fields);
      }
      return result;
    },
    parseResumeInitialState,
  );

  const filledCount = state.fields
    ? [
        state.fields.headline,
        state.fields.bio,
        state.fields.primary_category,
        state.fields.categories.length ? "categories" : "",
        state.fields.skills.length ? "skills" : "",
        state.fields.tools.length ? "tools" : "",
        state.fields.industries.length ? "industries" : "",
        state.fields.languages.length ? "languages" : "",
        state.fields.years_experience != null ? "years" : "",
      ].filter(Boolean).length
    : 0;

  return (
    <section className="resume-import-panel" id="resume" aria-labelledby="resume-import-title">
      <input
        ref={profileResumeRef}
        form={formId}
        type="file"
        name="resume"
        accept=".pdf,.doc,.docx"
        className="resume-profile-file-target"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="resume-import-copy">
        <span className="resume-import-icon"><FileText size={18} /></span>
        <div>
          <div className="resume-import-title-row">
            <strong id="resume-import-title">Use your resume to fill this profile</strong>
            {hasSavedResume && !selectedName ? <span className="badge badge-success"><CheckCircle2 size={12}/> Resume saved</span> : null}
          </div>
          <p>Choose your resume once. PDF/DOCX can fill profile fields automatically; PDF, DOC, or DOCX will be saved privately when you save the profile.</p>
          {hasSavedResume && savedResumeName && !selectedName ? <span className="resume-saved-name">Saved file: {savedResumeName}</span> : null}
        </div>
      </div>

      <form action={formAction} className="resume-import-form">
        <label className="resume-file-picker">
          <span>{selectedName || "Choose PDF or DOCX"}</span>
          <input
            ref={parseFileRef}
            type="file"
            name="resume_for_autofill"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedName(file?.name || "");
              if (file) attachResumeToProfileForm(file);
            }}
          />
        </label>
        <button className="btn btn-sm" type="submit" disabled={pending}>
          <UploadCloud size={15} />
          {pending ? "Reading resume..." : "Fill profile from resume"}
        </button>
      </form>

      {hasSavedResume && !selectedName ? (
        <form action={removeVaResumeAction} className="resume-remove-form">
          <button className="btn btn-sm btn-ghost" type="submit">Remove saved resume</button>
        </form>
      ) : null}

      {state.status === "error" ? (
        <div className="alert resume-import-message" role="alert">{state.message}</div>
      ) : null}
      {state.status === "success" ? (
        <div className="success-banner resume-import-message" role="status">
          Filled {filledCount || "the available"} profile fields. Review them, then click Save changes.
        </div>
      ) : null}
    </section>
  );
}
