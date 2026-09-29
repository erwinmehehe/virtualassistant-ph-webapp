export type ClientReplyStatus = "needs_action" | "awaiting_reply" | "handled" | "not_contacted";

export type ClientReplyStateRow = {
  lead_id: string;
  owner_id: string | null;
  job_id: string | null;
  name: string | null;
  company: string | null;
  crm_stage: string | null;
  last_client_reply_at: string | null;
  last_recruiter_response_at: string | null;
  last_recruiter_response_action: string | null;
  reply_status: ClientReplyStatus | string | null;
};

export function clientReplyStatusLabel(value?: string | null) {
  if (value === "needs_action") return "Client replied · needs action";
  if (value === "awaiting_reply") return "Awaiting client reply";
  if (value === "handled") return "Reply handled";
  return "Not contacted";
}

export function clientReplyNeedsAction(value?: string | null) {
  return value === "needs_action";
}
