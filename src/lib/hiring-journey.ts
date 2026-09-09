type Application = { id: string; status: string };
type Room = { id: string; status: string };
type Check = { workroom_id: string; completed_at: string | null };
export type HiringJourneyInput = {
  id: string; status: string; applications: Application[]; releasedCount: number;
  access?: string | null; commercial?: string | null; rooms: Room[]; checks: Check[];
  unavailable?: boolean;
};

/** Derive a next action for one role; never mix milestones from different hires. */
export function hiringJourney(input: HiringJourneyInput) {
  const role = `/workspace/client/jobs/${input.id}`;
  const action = (step: number, title: string, copy: string, owner: string, label: string, href = role) => ({ step, title, copy, owner, label, href });
  if (input.unavailable) return action(-1, "Progress unavailable", "Some hiring information could not be loaded. Open the role or refresh before making a decision.", "Status unavailable", "Open role");
  const activeRooms = input.rooms.filter(room => room.status === "active");
  const room = activeRooms.find(room => !input.checks.some(check => check.workroom_id === room.id) || input.checks.some(check => check.workroom_id === room.id && !check.completed_at)) || activeRooms[0] || input.rooms.find(room => room.status === "paused") || input.rooms[0];
  if (room) {
    const href = `/workspace/client/workroom#workroom-${room.id}`;
    if (room.status === "paused") return action(4, "Placement paused", "Review the placement and agree the next steps with your VA.", "You and your VA", "Open workroom", href);
    if (room.status === "completed") return action(5, "Placement completed", "Your hire history and placement review are available in the workroom.", "No hiring decision pending", "View placement", href);
    const checks = input.checks.filter(check => check.workroom_id === room.id);
    const remaining = checks.filter(check => !check.completed_at).length;
    if (!checks.length || remaining) return action(4, "Complete onboarding", checks.length ? `${remaining} onboarding item${remaining === 1 ? "" : "s"} remaining. Confirm access, expectations, and the first tasks together.` : "Open the workroom to review the agreed start and onboarding plan. Checklist progress is not available yet.", "You and your VA", "Continue onboarding", href);
    return action(5, "Onboarding complete", "Manage tasks, messages, and time in your workroom.", "You and your VA", "Open workroom", href);
  }
  if (input.status === "closed") return action(-1, "Role closed", "This role is no longer recruiting. Its hiring history is still available.", "No action required", "View role history");
  if (input.status === "draft") return action(0, "Finish your hiring brief", "Review the work, budget, and schedule, then submit the brief for review.", "Your next step", "Finish brief", `${role}/edit`);
  if (input.commercial === "quoted") return action(1, "Review your service fee", "Review the quoted fee and accept the terms when you are ready to publish this role.", "Your next step", "Review fee", `${role}#service-fee`);
  if (input.status === "pending") return action(1, "Brief under review", "Our team is reviewing your brief and preparing the role for recruitment.", "Recruiting team", "View brief");
  if (input.applications.some(app => app.status === "hired")) return action(4, "Check your hire setup", "A hire is recorded, but its workroom could not be found. Review the candidate record with your recruiting team.", "Recruiting team", "Review hire", `${role}?stage=hired`);
  const candidates = input.applications.filter(app => ["new", "reviewing", "shortlisted", "interview", "offered"].includes(app.status));
  if (candidates.length || input.releasedCount) {
    if (!["paid", "comped"].includes(input.access || "")) return action(2, input.access === "requested" ? "Access request under review" : "Review candidate access", "Candidates are ready. Their private details and hiring controls become available when access is active for this role.", input.access === "requested" ? "Recruiting team" : "Your next step", "View candidate access");
    const offer = candidates.find(app => app.status === "offered");
    if (offer) return action(3, "Confirm your hiring decision", "Agree the final rate, start date, and schedule, then confirm the hire to create its workroom.", "Your next step", "Review offer", `/workspace/client/candidates/${offer.id}`);
    const interview = candidates.find(app => app.status === "interview");
    if (interview) return action(3, "Review your interview decision", "Discuss the interview outcome and decide whether to make an offer.", "Your next step", "Review interview", `/workspace/client/candidates/${interview.id}`);
    return action(2, "Review your candidates", "Review applicants or invite a curated match to apply. An invitation lets the VA decide whether to proceed.", "Your next step", "Review shortlist", input.releasedCount ? `${role}#curated-shortlist` : `${role}#applicant-pipeline`);
  }
  return action(1, "Finding candidates", "Your role is published. Our team is finding suitable candidates for you to review.", "Recruiting team", "View role progress");
}
