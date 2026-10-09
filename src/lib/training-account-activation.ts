/**
 * Privacy-safe account activation measures for the admin training dashboard.
 *
 * Training origin is authoritative Auth app_metadata.account_type, never
 * user-editable user_metadata. All returned metrics are aggregates: no user
 * IDs, names, emails, or contact data are returned to the admin page.
 *
 * Candidate profiles are an OVERLAP, not a funnel stage: VA registration may
 * happen before or after training, so a conversion sequence is not inferred.
 */

export type TrainingOriginAccount = { id: string; created_at: string };
export type TrainingActivationEnrollment = {
  user_id: string;
  started_at: string;
  completed_at: string | null;
};
export type TrainingActivationLessonCompletion = { user_id: string };

export type TrainingActivationInput = {
  accounts: TrainingOriginAccount[];
  enrollments: TrainingActivationEnrollment[];
  lessonCompletions: TrainingActivationLessonCompletion[];
  verifiedVaProfileUserIds: string[];
  nowMs: number;
  complete?: boolean;
};

export type TrainingAccountActivation = {
  available: boolean;
  reason: string | null;
  totals: {
    registered: number;
    startedCourse: number;
    completedLesson: number;
    completedCourse: number;
    noStart72h: number;
    alsoVaProfile: number;
    graduatesAlsoVaProfile: number;
  };
  firstCourseSevenDay: {
    lookbackDays: number;
    eligible: number;
    activated: number;
    rate: number | null;
  };
  recentThirtyDayRegistrations: number;
};

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 90;
const FIRST_COURSE_DAYS = 7;
const NO_START_HOURS = 72;

const emptyTotals = () => ({
  registered: 0,
  startedCourse: 0,
  completedLesson: 0,
  completedCourse: 0,
  noStart72h: 0,
  alsoVaProfile: 0,
  graduatesAlsoVaProfile: 0,
});

function validDate(value: string | null | undefined): number | null {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

export function buildTrainingAccountActivation(input: TrainingActivationInput): TrainingAccountActivation {
  if (input.complete === false || !Number.isFinite(input.nowMs)) {
    return {
      available: false,
      reason: "Account or learning source data is incomplete. Activation rates are hidden until the data loads.",
      totals: emptyTotals(),
      firstCourseSevenDay: { lookbackDays: LOOKBACK_DAYS, eligible: 0, activated: 0, rate: null },
      recentThirtyDayRegistrations: 0,
    };
  }

  // Duplicate account rows never inflate the registered learner denominator.
  const accountsById = new Map<string, number>();
  for (const account of input.accounts) {
    if (!account.id) continue;
    const date = validDate(account.created_at);
    if (date === null || date > input.nowMs) continue;
    const previous = accountsById.get(account.id);
    if (previous === undefined || date < previous) accountsById.set(account.id, date);
  }

  const firstCourseByUser = new Map<string, number>();
  const completedUsers = new Set<string>();
  for (const enrollment of input.enrollments) {
    if (!accountsById.has(enrollment.user_id)) continue;
    const startedAt = validDate(enrollment.started_at);
    const accountAt = accountsById.get(enrollment.user_id)!;
    if (startedAt !== null && startedAt >= accountAt && startedAt <= input.nowMs) {
      const previous = firstCourseByUser.get(enrollment.user_id);
      if (previous === undefined || startedAt < previous) {
        firstCourseByUser.set(enrollment.user_id, startedAt);
      }
    }
    const completedAt = validDate(enrollment.completed_at);
    if (completedAt !== null && completedAt >= accountAt && completedAt <= input.nowMs) {
      completedUsers.add(enrollment.user_id);
    }
  }

  // Keep the learning funnel anchored to a valid course-start record.
  // Incomplete legacy imports must not manufacture a new enrolment.
  const lessonUsers = new Set(
    input.lessonCompletions.map(row => row.user_id).filter(id => firstCourseByUser.has(id))
  );
  const validGraduates = new Set(
    [...completedUsers].filter(id => firstCourseByUser.has(id))
  );
  const verifiedVaUsers = new Set(
    input.verifiedVaProfileUserIds.filter(id => accountsById.has(id))
  );

  const totals = emptyTotals();
  totals.registered = accountsById.size;
  totals.startedCourse = firstCourseByUser.size;
  totals.completedLesson = lessonUsers.size;
  totals.completedCourse = validGraduates.size;
  totals.alsoVaProfile = verifiedVaUsers.size;
  totals.graduatesAlsoVaProfile = [...validGraduates].filter(id => verifiedVaUsers.has(id)).length;

  let eligible = 0;
  let activated = 0;
  let recentThirtyDayRegistrations = 0;
  for (const [userId, registeredAt] of accountsById) {
    const firstCourseAt = firstCourseByUser.get(userId);
    if (firstCourseAt === undefined &&
        registeredAt <= input.nowMs - NO_START_HOURS * 3_600_000) {
      totals.noStart72h += 1;
    }
    if (registeredAt >= input.nowMs - 30 * DAY_MS) recentThirtyDayRegistrations += 1;
    // The denominator excludes signups too recent to have a full 7 days.
    if (registeredAt < input.nowMs - LOOKBACK_DAYS * DAY_MS ||
        registeredAt > input.nowMs - FIRST_COURSE_DAYS * DAY_MS) continue;
    eligible += 1;
    if (firstCourseAt !== undefined &&
        firstCourseAt <= registeredAt + FIRST_COURSE_DAYS * DAY_MS) activated += 1;
  }

  return {
    available: true,
    reason: null,
    totals,
    firstCourseSevenDay: {
      lookbackDays: LOOKBACK_DAYS,
      eligible,
      activated,
      rate: eligible ? Math.round(100 * activated / eligible) : null,
    },
    recentThirtyDayRegistrations,
  };
}
