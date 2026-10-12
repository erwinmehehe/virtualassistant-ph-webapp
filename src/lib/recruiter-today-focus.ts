/** Pure presentation model for the recruiter's compact Today view.
 * This does not change role status, shortlist approval or client access. */
export type FocusRole = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string;
  hiring_stage: string;
  hiring_stage_entered_at?: string | null;
  created_at: string;
  proposed_count: number;
  blocked_proposed_count: number;
  client_ready_proposed_count: number;
  released_count: number;
  unanswered_released_count: number;
  active_interview_count: number;
  interview_overdue: boolean;
  active_offer_count: number;
  offer_overdue: boolean;
  placement_created: boolean;
  client_id: string | null;
  commercial_status: string | null;
  candidate_access_status: string | null;
};

export type FocusSignals = {
  clientReplies: number;
  firstContacts: number;
  interviewsRequested: number;
  clientDecisionsWaiting: number;
  approvalReady: number;
};

export type FocusStage = "new" | "matching" | "client" | "interview";

export function focusStage(role: FocusRole): FocusStage {
  if (role.placement_created ||
    ["interviewing", "selected", "offer", "pre_start", "filled"].includes(role.hiring_stage) ||
    role.active_interview_count > 0 || role.active_offer_count > 0) return "interview";
  if (role.released_count > 0 || role.hiring_stage === "client_review") return "client";
  if (role.proposed_count > 0 || ["ready_to_recruit", "sourcing", "internal_review"].includes(role.hiring_stage)) return "matching";
  return "new";
}

export function focusRoleAction(role: FocusRole) {
  const base = `/workspace/recruiter/roles/${role.id}`;
  if (role.interview_overdue) return { label: "Check overdue interview", href: `${base}#interviews`, priority: 0 };
  if (role.offer_overdue) return { label: "Review pending offer", href: `${base}#interviews`, priority: 1 };
  if (role.unanswered_released_count > 0) return { label: "Follow up with client", href: `${base}#client-handoff`, priority: 2 };
  if (role.blocked_proposed_count > 0) return { label: "Check candidate readiness", href: `${base}#matching`, priority: 3 };
  if (role.proposed_count > 0 && role.released_count === 0) {
    const accessReady = ["paid", "comped"].includes(String(role.candidate_access_status || ""));
    const canSend = Boolean(role.client_id) && role.status === "published" &&
      role.commercial_status === "accepted" && accessReady &&
      role.client_ready_proposed_count === role.proposed_count;
    return canSend
      ? { label: "Send candidates to client", href: `${base}#matching`, priority: 4 }
      : { label: "Finish setup before sending", href: `${base}#overview`, priority: 4 };
  }
  if (role.active_interview_count > 0 || role.active_offer_count > 0)
    return { label: "Review interview or offer", href: `${base}#interviews`, priority: 5 };
  if (role.released_count > 0)
    return { label: "Review client's decisions", href: `${base}#client-handoff`, priority: 5 };
  return ["intake"].includes(role.hiring_stage)
    ? { label: "Review role brief", href: `${base}#overview`, priority: 6 }
    : { label: "Pick candidates for this role", href: `${base}#matching`, priority: 6 };
}

export function recruiterTodayFocus(roles: FocusRole[], signals: FocusSignals) {
  // The unit of attention is a role, not an event: never repeat a job ID.
  const uniqueRoles = [...new Map(roles.map((role) => [role.id, role])).values()];
  const ongoing = uniqueRoles.filter((role) => !["filled", "closed"].includes(role.hiring_stage));
  const pipelineRoles = uniqueRoles.filter((role) => role.hiring_stage !== "closed");
  const stages = { new: 0, matching: 0, client: 0, interview: 0 };
  for (const role of pipelineRoles) stages[focusStage(role)] += 1;

  const needsToday = ongoing.map((role) => ({
    id: role.id,
    title: role.title || "Virtual Assistant role",
    client: role.company_name || "Client",
    stage: focusStage(role),
    ...focusRoleAction(role),
  })).sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));

  // Exactly five human-readable priority choices. These are navigation
  // suggestions, not permission checks or auto-approval decisions.
  const choices = [
    { count: signals.clientReplies + signals.firstContacts, title: "Reply to clients", detail: "Someone is waiting for your response.", href: "/workspace/recruiter/crm?view=attention", label: "Open client messages" },
    { count: signals.interviewsRequested + ongoing.filter((r) => r.interview_overdue).length, title: "Schedule or review interviews", detail: "A client is ready to meet a candidate.", href: "/workspace/recruiter/roles?view=interviewing&sort=urgent", label: "Open interviews" },
    { count: signals.clientDecisionsWaiting, title: "Follow up on client decisions", detail: "Clients have shortlists waiting for their feedback.", href: "/workspace/recruiter/roles?view=waiting_client&sort=urgent", label: "Open client reviews" },
    { count: ongoing.filter((r) => r.proposed_count > 0 && r.released_count === 0).length, title: "Move candidate shortlists forward", detail: "Review readiness and finish setup before sending candidates.", href: "/workspace/recruiter/roles?view=client_review&sort=urgent", label: "Review shortlists" },
    { count: ongoing.filter((r) => r.released_count === 0 && r.proposed_count === 0).length, title: "Pick candidates for a role", detail: "Start with a role that still needs a shortlist.", href: "/workspace/recruiter/roles?view=needs_candidates&sort=urgent", label: "Find candidates" },
  ];
  const next = choices.find((choice) => choice.count > 0) || {
    count: 0,
    title: "You're caught up",
    detail: "No role needs immediate attention. Check Roles for routine work.",
    href: "/workspace/recruiter/roles",
    label: "Review roles",
  };

  return { stages, needsToday, next, approvalReady: signals.approvalReady };
}
