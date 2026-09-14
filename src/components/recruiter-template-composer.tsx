"use client";

import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { sendRecruiterTemplateEmailAction } from "@/app/actions/recruiter-ops";
import { RECRUITER_COMMUNICATION_TEMPLATES, personalizeRecruiterTemplate, recruiterTemplate } from "@/lib/recruiter-communications";

export function RecruiterTemplateComposer({
  leadId,
  firstName,
  defaultTemplateId = "first_response",
  returnTo = "/workspace/recruiter/today"
}: {
  leadId: string;
  firstName?: string | null;
  defaultTemplateId?: string;
  returnTo?: string;
}) {
  const initial = useMemo(() => recruiterTemplate(defaultTemplateId), [defaultTemplateId]);
  const [templateId, setTemplateId] = useState(initial.id);
  const [subject, setSubject] = useState(personalizeRecruiterTemplate(initial.subject, firstName));
  const [message, setMessage] = useState(personalizeRecruiterTemplate(initial.body, firstName));
  const [followUpDays, setFollowUpDays] = useState(initial.followUpDays);

  function chooseTemplate(id: string) {
    const selected = recruiterTemplate(id);
    setTemplateId(selected.id);
    setSubject(personalizeRecruiterTemplate(selected.subject, firstName));
    setMessage(personalizeRecruiterTemplate(selected.body, firstName));
    setFollowUpDays(selected.followUpDays);
  }

  return <details className="staff-followup-details">
    <summary className="btn btn-sm btn-primary"><Mail size={14}/> Email client</summary>
    <form action={sendRecruiterTemplateEmailAction} className="stack staff-followup-form">
      <input type="hidden" name="lead_id" value={leadId}/>
      <input type="hidden" name="template_id" value={templateId}/>
      <input type="hidden" name="return_to" value={returnTo}/>
      <div className="grid-2">
        <div className="field">
          <label>Template</label>
          <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>
            {RECRUITER_COMMUNICATION_TEMPLATES.map((template) => <option value={template.id} key={template.id}>{template.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Next follow-up</label>
          <select name="follow_up_days" value={followUpDays} onChange={(event) => setFollowUpDays(Number(event.target.value))}>
            {[1,2,3,7,14].map((days) => <option key={days} value={days}>{days === 1 ? "Tomorrow" : `In ${days} days`}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Subject</label><input name="subject" value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} maxLength={180}/></div>
      <div className="field"><label>Message</label><textarea name="message" value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={5000}/></div>
      <button className="btn btn-primary" type="submit">Send + schedule follow-up</button>
    </form>
  </details>;
}
