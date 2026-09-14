export type RecruiterCommunicationTemplate = {
  id: string;
  label: string;
  subject: string;
  body: string;
  followUpDays: number;
};

export const RECRUITER_COMMUNICATION_TEMPLATES: RecruiterCommunicationTemplate[] = [
  {
    id: "first_response",
    label: "First response",
    subject: "Your VirtualAssistant.com.ph hiring request",
    body: "Hi {{first_name}},\n\nThanks for reaching out to VirtualAssistant.com.ph. I’m reviewing your request now and want to make sure we understand the role, schedule, and priorities before we shortlist candidates.\n\nIf anything has changed since you submitted the form, reply here and I’ll include it in the brief.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 2
  },
  {
    id: "discovery_confirmation",
    label: "Discovery confirmation",
    subject: "Your discovery call with VirtualAssistant.com.ph",
    body: "Hi {{first_name}},\n\nYour discovery call is booked. We’ll use the call to confirm the role, priorities, schedule, budget, and what a successful first 30 days should look like.\n\nYou’ll receive the meeting details in your booking confirmation.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 1
  },
  {
    id: "no_show",
    label: "No-show follow-up",
    subject: "Reschedule your VirtualAssistant.com.ph discovery call",
    body: "Hi {{first_name}},\n\nWe missed you on the discovery call. If hiring is still a priority, reply here or use your booking link to choose another time.\n\nWe can pick up from your original hiring brief, so you won’t need to start over.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 2
  },
  {
    id: "proposal_followup",
    label: "Proposal follow-up",
    subject: "Checking in on your VirtualAssistant.com.ph proposal",
    body: "Hi {{first_name}},\n\nI wanted to check whether you had any questions about the proposal or the recommended next step.\n\nIf the role, timing, or scope has changed, send me the update and I’ll adjust the plan before we move forward.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 3
  },
  {
    id: "shortlist_ready",
    label: "Shortlist ready",
    subject: "Your VA shortlist is ready",
    body: "Hi {{first_name}},\n\nWe’ve prepared a shortlist for your role. The candidates were selected against the work, tools, schedule, and experience in your hiring brief.\n\nPlease review the shortlist and let us know who you’d like to interview or what you want us to refine.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 2
  },
  {
    id: "reactivation",
    label: "Reactivation",
    subject: "Is this VA role still a priority?",
    body: "Hi {{first_name}},\n\nI’m checking whether this role is still active. If you still need support, we can continue from the existing brief and update anything that has changed.\n\nIf the timing is no longer right, just let me know and I’ll close the loop for now.\n\nBest,\nVirtualAssistant.com.ph Hiring Team",
    followUpDays: 7
  }
];

export function recruiterTemplate(id?: string | null) {
  return RECRUITER_COMMUNICATION_TEMPLATES.find((template) => template.id === id) || RECRUITER_COMMUNICATION_TEMPLATES[0];
}

export function personalizeRecruiterTemplate(value: string, firstName?: string | null) {
  return value.replaceAll("{{first_name}}", firstName?.trim() || "there");
}
