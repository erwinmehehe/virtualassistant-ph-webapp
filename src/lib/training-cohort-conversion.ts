/**
 * Enrollment-date cohorts for internal training quality decisions.
 * A 7/14-day completion rate counts only learners whose start date is old
 * enough to observe the entire interval. Never turn immature starts into
 * failed completions. No learner identifiers leave this aggregation.
 */
export type TrainingCohortCourse = {
  id: string;
  slug: string;
  title: string;
  status: string;
};

export type TrainingCohortEnrollment = {
  user_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
};

export type CohortWindow = {
  eligible: number;
  completed: number;
  rate: number | null;
};

export type CourseCohortRow = {
  id: string;
  slug: string;
  title: string;
  sevenDay: CohortWindow;
  fourteenDay: CohortWindow;
};

export type TrainingCohortConversion = {
  available: boolean;
  reason: string | null;
  lookbackDays: number;
  totals: {
    sevenDay: CohortWindow;
    fourteenDay: CohortWindow;
  };
  courses: CourseCohortRow[];
};

export type CohortConversionInput = {
  courses: TrainingCohortCourse[];
  enrollments: TrainingCohortEnrollment[];
  nowMs: number;
  complete?: boolean;
};

const DAY_MS = 86_400_000;
const LOOKBACK_DAYS = 90;

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function blankWindow(): CohortWindow {
  return { eligible: 0, completed: 0, rate: null };
}

function finishWindow(value: CohortWindow): CohortWindow {
  return {
    ...value,
    rate: value.eligible ? Math.round(value.completed * 100 / value.eligible) : null,
  };
}

function blank(): TrainingCohortConversion {
  return {
    available: false,
    reason: "Cohort source data is incomplete. Retry before making course decisions.",
    lookbackDays: LOOKBACK_DAYS,
    totals: { sevenDay: blankWindow(), fourteenDay: blankWindow() },
    courses: [],
  };
}

export function buildTrainingCohortConversion(input: CohortConversionInput): TrainingCohortConversion {
  if (input.complete === false || !Number.isFinite(input.nowMs)) return blank();

  const activeCourses = input.courses.filter(course => course.status === "published");
  const byId = new Map(activeCourses.map(course => [course.id, {
    id: course.id, title: course.title, slug: course.slug,
    sevenDay: blankWindow(), fourteenDay: blankWindow(),
  } satisfies CourseCohortRow]));

  // Defensive de-duplication by learner-course, using earliest valid
  // enrollment start and the earliest valid completion after it.
  const enrollments = new Map<string, { courseId: string; starts: number[]; finishes: number[] }>();
  for (const row of input.enrollments) {
    if (!byId.has(row.course_id)) continue;
    const start = parseTime(row.started_at);
    if (start === null) continue;
    const key = row.user_id + ":" + row.course_id;
    const entry = enrollments.get(key) || { courseId: row.course_id, starts: [], finishes: [] };
    entry.starts.push(start);
    const finish = parseTime(row.completed_at);
    if (finish !== null) entry.finishes.push(finish);
    enrollments.set(key, entry);
  }

  for (const entry of enrollments.values()) {
    const start = Math.min(...entry.starts);
    if (start < input.nowMs - LOOKBACK_DAYS * DAY_MS || start > input.nowMs) continue;
    const firstFinish = entry.finishes.filter(time => time >= start && time <= input.nowMs)
      .sort((a, b) => a - b)[0] ?? null;
    const row = byId.get(entry.courseId)!;
    for (const [days, window] of [
      [7, row.sevenDay],
      [14, row.fourteenDay],
    ] as const) {
      if (start > input.nowMs - days * DAY_MS) continue;
      window.eligible += 1;
      if (firstFinish !== null && firstFinish <= start + days * DAY_MS) {
        window.completed += 1;
      }
    }
  }

  const rows = [...byId.values()]
    .filter(row => row.sevenDay.eligible > 0 || row.fourteenDay.eligible > 0)
    .map(row => ({
      ...row,
      sevenDay: finishWindow(row.sevenDay),
      fourteenDay: finishWindow(row.fourteenDay),
    }))
    .sort((a, b) =>
      // Mature course cohorts with enough data and the lowest 14-day
      // completion get reviewed first; sample sizes remain visible.
      Number(b.fourteenDay.eligible >= 5) - Number(a.fourteenDay.eligible >= 5) ||
      (a.fourteenDay.rate ?? 101) - (b.fourteenDay.rate ?? 101) ||
      b.fourteenDay.eligible - a.fourteenDay.eligible ||
      a.title.localeCompare(b.title),
    );

  const totals = {
    sevenDay: blankWindow(),
    fourteenDay: blankWindow(),
  };
  for (const row of rows) {
    totals.sevenDay.eligible += row.sevenDay.eligible;
    totals.sevenDay.completed += row.sevenDay.completed;
    totals.fourteenDay.eligible += row.fourteenDay.eligible;
    totals.fourteenDay.completed += row.fourteenDay.completed;
  }

  return {
    available: true,
    reason: null,
    lookbackDays: LOOKBACK_DAYS,
    totals: {
      sevenDay: finishWindow(totals.sevenDay),
      fourteenDay: finishWindow(totals.fourteenDay),
    },
    courses: rows,
  };
}
