/** Small, testable action rules shared by the client and VA homepages.
 * A workflow stage is never evidence that a particular person owes a decision. */
export type BeginnerAction = {
  title: string;
  copy: string;
  href: string;
  label: string;
  tone: "decision" | "waiting";
};

export type HomeRole = {
  id: string;
  title: string | null;
  status: string;
  moderation_status?: string | null;
};

export type HomeOffer = {
  id: string;
  job_id: string;
  status: string;
};

export type HomeInterview = {
  id: string;
  job_id: string;
  status: string;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  client_decision?: string | null;
};

export type HomeShortlist = {
  job_id: string;
  client_decision?: string | null;
};

export type HomeTerms = {
  job_id: string;
  commercial_status?: string | null;
};

export type HomeAccess = {
  job_id: string;
  access_status?: string | null;
};

export type HomeWorkItem = { workroom_id: string };

function titleFor(roles: HomeRole[], id: string) {
  return roles.find((role) => role.id === id)?.title || "your role";
}

export function resolveClientHomeAction(input: {
  roles: HomeRole[];
  offers: HomeOffer[];
  interviews: HomeInterview[];
  shortlists: HomeShortlist[];
  terms: HomeTerms[];
  access: HomeAccess[];
  timeToReview: HomeWorkItem[];
  tasksToReview: HomeWorkItem[];
  activePlacements: number;
  now?: number;
}): BeginnerAction {
  const { roles, offers, interviews, shortlists, terms, access, timeToReview, tasksToReview } = input;
  const now = input.now ?? Date.now();
  const active = roles.filter((role) => !["closed", "filled"].includes(role.status));
  const activeIds = new Set(active.map((role) => role.id));
  const openOffers = offers.filter((offer) => activeIds.has(offer.job_id));
  const needsConfirmation = openOffers.find((offer) => offer.status === "pending_client");
  if (needsConfirmation) return {
    title: `Confirm the offer for ${titleFor(active, needsConfirmation.job_id)}`,
    copy: "The VA accepted the terms. Review the final rate, hours and start date before confirming the hire.",
    href: "/workspace/client/offers",
    label: "Review final offer",
    tone: "decision",
  };

  const taskCount = tasksToReview.length;
  const timeCount = timeToReview.length;
  if (taskCount || timeCount) return {
    title: `Review ${taskCount + timeCount} work item${taskCount + timeCount === 1 ? "" : "s"}`,
    copy: "Your VA submitted work or time for your approval. Review it before it moves forward.",
    href: "/workspace/client/workroom",
    label: "Review submitted work",
    tone: "decision",
  };

  const toSchedule = interviews.find((row) =>
    activeIds.has(row.job_id) && row.status === "requested" && !row.client_decision
  );
  if (toSchedule) return {
    title: `Schedule an interview for ${titleFor(active, toSchedule.job_id)}`,
    copy: "An interview was requested and needs a time. Choose a slot that works for you.",
    href: "/workspace/client/interviews",
    label: "Choose an interview time",
    tone: "decision",
  };

  const needsFeedback = interviews.find((row) => {
    if (!activeIds.has(row.job_id) || row.status !== "scheduled" || row.client_decision || !row.scheduled_at) return false;
    const time = Date.parse(row.scheduled_at);
    return Number.isFinite(time) && time + Number(row.duration_minutes || 30) * 60_000 <= now;
  });
  if (needsFeedback) return {
    title: `Share interview feedback for ${titleFor(active, needsFeedback.job_id)}`,
    copy: "The interview time has passed. Let your recruiter know whether to proceed, hold or pass.",
    href: "/workspace/client/interviews",
    label: "Record your decision",
    tone: "decision",
  };

  const quoted = terms.find((term) => active.some((role) => role.id === term.job_id && role.moderation_status !== "review") && term.commercial_status === "quoted");
  if (quoted) return {
    title: `Review hiring terms for ${titleFor(active, quoted.job_id)}`,
    copy: "Your recruiter has prepared the service terms. Check any fee and approve only if you agree.",
    href: `/workspace/client/jobs/${quoted.job_id}#service-terms`,
    label: "Review service terms",
    tone: "decision",
  };

  const readyShortlist = shortlists.find((row) =>
    active.some((role) => role.id === row.job_id && role.status === "published" && role.moderation_status !== "review") &&
    (!row.client_decision || row.client_decision === "hold") &&
    ["paid", "comped"].includes(access.find((item) => item.job_id === row.job_id)?.access_status || "")
  );
  if (readyShortlist) return {
    title: `Review candidates for ${titleFor(active, readyShortlist.job_id)}`,
    copy: "Your recruiter has released candidates for your review. Choose who to interview or ask for other options.",
    href: `/workspace/client/candidates?role=${encodeURIComponent(readyShortlist.job_id)}#recruiter-shortlist`,
    label: "Review candidates",
    tone: "decision",
  };

  const lockedShortlist = shortlists.find((row) =>
    activeIds.has(row.job_id) && (!row.client_decision || row.client_decision === "hold") &&
    !["paid", "comped"].includes(access.find((item) => item.job_id === row.job_id)?.access_status || "")
  );
  if (lockedShortlist) return {
    title: `Candidates are being prepared for ${titleFor(active, lockedShortlist.job_id)}`,
    copy: "Candidate access is not active yet. You can check the role and ask the hiring team what is needed.",
    href: `/workspace/client/jobs/${lockedShortlist.job_id}`,
    label: "View hiring status",
    tone: "waiting",
  };

  const waitingVa = openOffers.find((offer) => offer.status === "pending_va");
  if (waitingVa) return {
    title: `Waiting for the VA to accept ${titleFor(active, waitingVa.job_id)}`,
    copy: "Your offer has been sent. The next decision belongs to the VA, not you.",
    href: "/workspace/client/offers",
    label: "Check offer status",
    tone: "waiting",
  };

  const upcomingInterview = interviews.find((row) =>
    activeIds.has(row.job_id) && row.status === "scheduled" && !row.client_decision &&
    Boolean(row.scheduled_at) && Date.parse(row.scheduled_at || "") > now
  );
  if (upcomingInterview) return {
    title: `Interview scheduled for ${titleFor(active, upcomingInterview.job_id)}`,
    copy: "Your interview is on the calendar. Check the time and meeting link.",
    href: "/workspace/client/interviews",
    label: "See interview details",
    tone: "waiting",
  };

  const underReview = active.find((role) => role.moderation_status === "review");
  if (underReview) return {
    title: `Your role is waiting for a content review`,
    copy: "The job is not public while the hiring team checks its content. They'll let you know what to change.",
    href: `/workspace/client/jobs/${underReview.id}`,
    label: "View review status",
    tone: "waiting",
  };

  if (active.length) return {
    title: "Your recruiter is working on your hiring request",
    copy: "Nothing needs your decision right now. Open your role to see progress or message your recruiter.",
    href: `/workspace/client/jobs/${active[0].id}`,
    label: "See hiring progress",
    tone: "waiting",
  };
  if (input.activePlacements > 0) return {
    title: "Your VA placement is active",
    copy: "Your team is working. Open the workroom to view tasks, hours, and updates.",
    href: "/workspace/client/workroom",
    label: "Open My Team",
    tone: "waiting",
  };

  return {
    title: "Tell us about the VA you need",
    copy: "Describe the work you want help with. We'll guide you through the role and budget.",
    href: "/workspace/client/jobs/new",
    label: "Post your first job",
    tone: "decision",
  };
}

export function resolveVaHomeAction(input: {
  offers: HomeOffer[];
  interviews: HomeInterview[];
  pendingInvites: number;
  workroomCount: number;
  recruiterRequests: Array<{ body?: string | null }>;
  completionScore: number;
  completionNext?: { label: string; href: string } | null;
  minimumProfileScore: number;
  vetted: boolean;
  unreadMessages?: number;
  now?: number;
}): BeginnerAction {
  const now = input.now ?? Date.now();
  const offerToAccept = input.offers.find((offer) => offer.status === "pending_va");
  if (offerToAccept) return {
    title: "You have a placement offer to review",
    copy: "Check the hourly rate, hours, schedule and start date before accepting or declining.",
    href: "/workspace/va/offers",
    label: "Review offer",
    tone: "decision",
  };

  const interview = input.interviews.find((row) =>
    row.status === "scheduled" && Boolean(row.scheduled_at) &&
    Date.parse(row.scheduled_at || "") > now
  );
  if (interview) return {
    title: "Your interview is scheduled",
    copy: "Check the interview time, meeting link and role details so you can prepare.",
    href: "/workspace/va/interviews",
    label: "See interview details",
    tone: "decision",
  };

  if (input.pendingInvites > 0) return {
    title: `Respond to ${input.pendingInvites} job opportunit${input.pendingInvites === 1 ? "y" : "ies"}`,
    copy: "A recruiter invited you to continue. Review the role and say whether you're interested.",
    href: "/workspace/va/applications",
    label: "Review opportunities",
    tone: "decision",
  };

  if (input.workroomCount > 0) return {
    title: "Your placement is active",
    copy: "See your assigned tasks, log your work time and complete setup items.",
    href: "/workspace/va/workroom",
    label: "Open My Work",
    tone: "decision",
  };

  if (input.recruiterRequests.length > 0) return {
    title: "Your recruiter requested an update",
    copy: input.recruiterRequests[0]?.body || "Update the requested profile details so the recruiter can continue.",
    href: "/workspace/va/profile",
    label: "Review request",
    tone: "decision",
  };

  const waitingClient = input.offers.find((offer) => offer.status === "pending_client");
  if (waitingClient) return {
    title: "Waiting for the client to confirm your offer",
    copy: "You've accepted the offer. The client needs to complete the final confirmation.",
    href: "/workspace/va/offers",
    label: "Check offer status",
    tone: "waiting",
  };

  if (input.completionScore < input.minimumProfileScore && input.completionNext) return {
    title: "Finish your profile for screening",
    copy: `Add ${input.completionNext.label.toLowerCase()} to help your recruiter assess your application.`,
    href: input.completionNext.href,
    label: "Continue profile",
    tone: "decision",
  };

  if (!input.vetted) return {
    title: "Complete your recruiter screening",
    copy: "Check your remaining verification steps. Your recruiter will review the results.",
    href: "/workspace/va/vetting",
    label: "Continue screening",
    tone: "decision",
  };

  if ((input.unreadMessages || 0) > 0) return {
    title: "You have a message from your recruiter",
    copy: "Review the message and reply if a response is needed.",
    href: "/workspace/va/messages",
    label: "Open messages",
    tone: "decision",
  };

  return {
    title: "You're ready to explore jobs",
    copy: "Browse open roles that fit your experience and availability. Track applications here.",
    href: "/workspace/va/jobs",
    label: "Find jobs",
    tone: "waiting",
  };
}
