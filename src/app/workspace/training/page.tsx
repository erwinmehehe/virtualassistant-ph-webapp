import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Compass,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingDashboard, type TrainingCourseSummary } from "@/lib/training";
import { vaCategoryLabel } from "@/lib/constants";
import { startTrainingCourseAction } from "@/app/actions/training";

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function assessmentLabel(course: TrainingCourseSummary) {
  if (course.assessmentStatus === "passed") return "Assessment passed";
  if (course.assessmentStatus === "in_review") return "Assessment in review";
  if (course.assessmentStatus === "needs_revision") return "Assessment needs revision";
  if (course.assessmentStatus === "ready") return "Assessment ready";
  if (course.assessmentStatus === "not_required") return "No final assessment";
  return "Assessment not started";
}

function nextCourseHref(course: TrainingCourseSummary) {
  if (course.nextLesson) {
    return `/workspace/training/courses/${course.slug}/lessons/${course.nextLesson.id}`;
  }
  if (course.nextAssessment) {
    return `/workspace/training/courses/${course.slug}/assessments/${course.nextAssessment.id}`;
  }
  return `/workspace/training/courses/${course.slug}`;
}

function nextCourseLabel(course: TrainingCourseSummary) {
  if (course.nextLesson) return "Continue lesson";
  if (course.nextAssessment) return "Open assessment";
  return "Open course";
}

const SPECIALTY_PATHS: Record<string, { title: string; slugs: string[] }> = {
  "Administrative Support": {
    title: "Administrative Support path",
    slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  "Bookkeeping & Finance": {
    title: "Bookkeeping & Finance path",
    slugs: ["virtual-assistant-foundations", "bookkeeping-administration", "xero-workflows-for-virtual-assistants", "payroll-administration"],
  },
  "Customer Service": {
    title: "Customer Service path",
    slugs: ["virtual-assistant-foundations", "customer-support-virtual-assistant", "operations-virtual-assistant"],
  },
  "Dental & Healthcare": {
    title: "Healthcare Administration path",
    slugs: ["virtual-assistant-foundations", "medical-healthcare-virtual-assistant", "cliniko-for-virtual-assistants"],
  },
  Ecommerce: {
    title: "Ecommerce path",
    slugs: ["virtual-assistant-foundations", "ecommerce-virtual-assistant", "customer-support-virtual-assistant", "marketing-virtual-assistant"],
  },
  "Executive Assistance": {
    title: "Executive VA path",
    slugs: ["virtual-assistant-foundations", "executive-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  "Lead Generation & Sales": {
    title: "Lead Generation & Sales path",
    slugs: ["virtual-assistant-foundations", "sales-lead-generation-virtual-assistant", "customer-support-virtual-assistant"],
  },
  "Marketing & Social Media": {
    title: "Marketing & Social Media path",
    slugs: ["virtual-assistant-foundations", "marketing-virtual-assistant", "social-media-virtual-assistant"],
  },
  "Phone & Reception": {
    title: "Reception & Client Support path",
    slugs: ["virtual-assistant-foundations", "customer-support-virtual-assistant", "operations-virtual-assistant"],
  },
  "Real Estate": {
    title: "Real Estate VA path",
    slugs: ["virtual-assistant-foundations", "real-estate-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  SEO: {
    title: "SEO Virtual Assistant path",
    slugs: ["virtual-assistant-foundations", "seo-virtual-assistant", "marketing-virtual-assistant"],
  },
  "Video Editing & Creative": {
    title: "Creative Operations path",
    slugs: ["virtual-assistant-foundations", "marketing-virtual-assistant", "social-media-virtual-assistant"],
  },
  "Web & WordPress": {
    title: "Web Operations path",
    slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
  },
};

const DEFAULT_PATH = {
  title: "Core VA path",
  slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
};

const AUSTRALIA_SPECIALIZATIONS = [
  {
    slug: "tradie-operations",
    title: "Tradie & home-service operations",
    bestFor: "Field-service businesses such as plumbing, electrical, HVAC, cleaning, pest control, and maintenance.",
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "australian-trades-administration",
      "servicem8-for-virtual-assistants",
      "xero-workflows-for-virtual-assistants",
    ],
  },
  {
    slug: "property-management",
    title: "Property management administration",
    bestFor: "Property managers, real-estate teams, maintenance coordinators, and residential portfolio support.",
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "property-management-administration-australia",
      "xero-workflows-for-virtual-assistants",
    ],
  },
  {
    slug: "ndis-allied-health",
    title: "NDIS & allied health administration",
    bestFor: "NDIS providers, allied-health clinics, therapy practices, and non-clinical healthcare administration.",
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "ndis-administration-fundamentals",
      "australian-allied-health-administration",
      "cliniko-for-virtual-assistants",
    ],
  },
  {
    slug: "mortgage-broking",
    title: "Mortgage broking administration",
    bestFor: "Mortgage brokers and finance teams needing organised document, CRM, milestone, and client administration.",
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "mortgage-broking-administration-australia",
    ],
  },
] as const;

const FILTERS = [
  ["all", "All"],
  ["foundation", "Foundation"],
  ["role", "Role"],
  ["software", "Software"],
  ["industry", "Industry"],
  ["australia", "Australia"],
] as const;

type FilterKey = (typeof FILTERS)[number][0];

function isFilterKey(value: string | undefined): value is FilterKey {
  return FILTERS.some(([key]) => key === value);
}

function matchesFilter(course: TrainingCourseSummary, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "foundation") return course.category === "foundation";
  if (filter === "software") return course.category === "software";
  if (filter === "industry") return course.category === "industry";
  if (filter === "australia") return course.country_focus === "Australia";
  return course.category === "skill" && course.country_focus !== "Australia";
}

function CourseCard({
  course,
  mode,
}: {
  course: TrainingCourseSummary;
  mode: "active" | "completed" | "not-started";
}) {
  const action = mode === "active" ? (
    <Link className="btn btn-sm btn-primary" href={nextCourseHref(course)} data-track="training_course_continue">
      {nextCourseLabel(course)} <ArrowRight size={14} />
    </Link>
  ) : mode === "completed" ? (
    <Link className="btn btn-sm" href={`/workspace/training/courses/${course.slug}`}>
      Review course <ArrowRight size={14} />
    </Link>
  ) : (
    <form action={startTrainingCourseAction}>
      <input type="hidden" name="course_id" value={course.id} />
      <button className="btn btn-sm btn-primary" type="submit" data-track="training_course_start_click">
        Start course <ArrowRight size={14} />
      </button>
    </form>
  );

  return (
    <article className="training-course-card">
      <div className="training-course-card-top">
        <div>
          <div className="training-course-eyebrow">
            <span>{course.category === "skill" ? "Role" : course.category}</span>
            {course.country_focus ? <span>{course.country_focus}</span> : null}
          </div>
          <h3>{course.title}</h3>
          <p>{course.summary || "Practical training with realistic examples, exercises, handoffs, and QA checks."}</p>
        </div>
        {mode === "completed" ? <CheckCircle2 className="training-course-complete-icon" size={20} /> : null}
      </div>

      <div className="training-course-meta">
        <span><BookOpenCheck size={14} /> {course.lessonCount} lessons</span>
        <span><Clock3 size={14} /> {duration(course.estimated_minutes)}</span>
        <span><FileCheck2 size={14} /> {assessmentLabel(course)}</span>
      </div>

      {mode !== "not-started" ? (
        <div className="training-course-progress">
          <div className="row-between">
            <span>{mode === "completed" ? "Completed" : `${course.completedLessons} of ${course.lessonCount} lessons`}</span>
            <strong>{course.progressPercent}%</strong>
          </div>
          <div className="progress" aria-label={`${course.title} ${course.progressPercent}% complete`}>
            <span style={{ width: `${course.progressPercent}%` }} />
          </div>
        </div>
      ) : null}

      <div className="training-course-card-action">{action}</div>
    </article>
  );
}

export default async function TrainingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter: FilterKey = isFilterKey(params.filter) ? params.filter : "all";
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const { courses, learnerProfile, error } = await getTrainingDashboard(userId);

  const active = courses
    .filter((course) => course.enrolled && !course.completedAt)
    .sort((a, b) => {
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bTime - aTime;
    });
  const completed = courses
    .filter((course) => Boolean(course.completedAt))
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
  const notStarted = courses.filter((course) => !course.enrolled && !course.completedAt);
  const filteredNotStarted = notStarted.filter((course) => matchesFilter(course, filter));
  const certificates = courses
    .filter((course) => course.certificate && !course.certificate.revoked_at)
    .sort(
      (a, b) =>
        new Date(b.certificate?.issued_at || 0).getTime() -
        new Date(a.certificate?.issued_at || 0).getTime(),
    );

  const resumeCourse = active[0] || null;
  const specialty = learnerProfile?.primaryCategory || null;
  const recommendation = (specialty && SPECIALTY_PATHS[specialty]) || DEFAULT_PATH;
  const recommendedCourses = recommendation.slugs
    .map((slug) => courses.find((course) => course.slug === slug) || null)
    .filter((course): course is TrainingCourseSummary => Boolean(course));
  const completedRecommended = recommendedCourses.filter((course) => Boolean(course.completedAt)).length;
  const nextRecommended = recommendedCourses.find((course) => !course.completedAt) || null;
  const recommendedProgress = recommendedCourses.length
    ? Math.round((completedRecommended / recommendedCourses.length) * 100)
    : 0;

  return (
    <div className="dash-page role-overview training-home">
      {resumeCourse ? (
        <section className="training-resume-card" aria-labelledby="continue-learning-title">
          <div className="training-resume-icon"><Sparkles size={20} /></div>
          <div className="training-resume-copy">
            <span className="small">Continue where you left off</span>
            <h2 id="continue-learning-title">{resumeCourse.title}</h2>
            {resumeCourse.nextLesson ? (
              <p>
                Next lesson: <strong>{resumeCourse.nextLesson.title}</strong>
                <span> · {resumeCourse.nextLesson.estimatedMinutes} min</span>
              </p>
            ) : resumeCourse.nextAssessment ? (
              <p>Lessons complete. Next: <strong>{resumeCourse.nextAssessment.title}</strong></p>
            ) : (
              <p>Your course is ready to reopen.</p>
            )}
          </div>
          <Link
            className="btn btn-primary training-resume-action"
            href={nextCourseHref(resumeCourse)}
            data-track="training_resume_next"
          >
            {nextCourseLabel(resumeCourse)} <ArrowRight size={15} />
          </Link>
        </section>
      ) : nextRecommended ? (
        <section className="training-resume-card" aria-labelledby="continue-learning-title">
          <div className="training-resume-icon"><Compass size={20} /></div>
          <div className="training-resume-copy">
            <span className="small">Your next course</span>
            <h2 id="continue-learning-title">{nextRecommended.title}</h2>
            <p>{specialty ? `Recommended from your ${vaCategoryLabel(specialty)} profile.` : "Start with the path that builds the strongest general VA foundation."}</p>
          </div>
          {nextRecommended.enrolled ? (
            <Link className="btn btn-primary training-resume-action" href={nextCourseHref(nextRecommended)}>
              Continue <ArrowRight size={15} />
            </Link>
          ) : (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={nextRecommended.id} />
              <button className="btn btn-primary training-resume-action" type="submit">
                Start next <ArrowRight size={15} />
              </button>
            </form>
          )}
        </section>
      ) : null}

      <DashHeader
        kicker="Free learning for Filipino VAs"
        title="My learning"
        subtitle={<>Continue your current lesson, follow a recommended path, or choose one course from the library. Training remains separate from hiring and certificates are free.</>}
      />

      {error ? (
        <section className="card dashboard-section-card">
          <h2>Training setup is not active yet</h2>
          <p className="muted">The learning interface is ready, but the training database migration still needs to be applied for this environment.</p>
        </section>
      ) : null}

      <div className="training-home-stats" aria-label="Learning summary">
        <span><strong>{active.length}</strong> active</span>
        <span><strong>{completed.length}</strong> completed</span>
        <span><strong>{certificates.length}</strong> certificates</span>
      </div>

      {recommendedCourses.length ? (
        <section className="card dashboard-section-card training-path-card">
          <div className="training-section-heading">
            <div>
              <span className="small">Recommended for you</span>
              <h2>{recommendation.title}</h2>
              <p>
                {specialty
                  ? `Based on your primary specialty: ${vaCategoryLabel(specialty)}.`
                  : "No VA specialty is set yet, so this starts with a practical general path."}
              </p>
            </div>
            <div className="training-path-count">
              <strong>{completedRecommended} of {recommendedCourses.length}</strong>
              <span>courses complete</span>
            </div>
          </div>

          <div className="progress training-path-progress" aria-label={`${recommendedProgress}% of recommended path complete`}>
            <span style={{ width: `${recommendedProgress}%` }} />
          </div>

          <ol className="training-path-steps">
            {recommendedCourses.map((course, index) => {
              const done = Boolean(course.completedAt);
              const current = nextRecommended?.id === course.id;
              return (
                <li className={done ? "is-complete" : current ? "is-current" : ""} key={course.id}>
                  <span className="training-path-step-number">{done ? <CheckCircle2 size={16} /> : index + 1}</span>
                  <span>
                    <strong>{course.title}</strong>
                    <small>{done ? "Completed" : current ? course.enrolled ? "In progress" : "Next course" : "Available after your current step"}</small>
                  </span>
                </li>
              );
            })}
          </ol>

          {nextRecommended ? (
            <div className="training-path-next">
              <div>
                <span className="small">Automatically selected next</span>
                <strong>{nextRecommended.title}</strong>
              </div>
              {nextRecommended.enrolled ? (
                <Link className="btn btn-primary btn-sm" href={nextCourseHref(nextRecommended)}>
                  {nextCourseLabel(nextRecommended)} <ArrowRight size={14} />
                </Link>
              ) : (
                <form action={startTrainingCourseAction}>
                  <input type="hidden" name="course_id" value={nextRecommended.id} />
                  <button className="btn btn-primary btn-sm" type="submit">
                    Start next <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="training-path-next is-complete">
              <div><strong>Path complete</strong><span className="small">You have completed every published course in this path.</span></div>
              <CheckCircle2 size={20} />
            </div>
          )}
        </section>
      ) : null}

      {active.length ? (
        <section className="training-home-section" aria-labelledby="active-courses-title">
          <div className="training-section-heading">
            <div>
              <span className="small">Active learning</span>
              <h2 id="active-courses-title">Courses in progress</h2>
            </div>
          </div>
          <div className="training-course-grid">
            {active.map((course) => <CourseCard course={course} mode="active" key={course.id} />)}
          </div>
        </section>
      ) : null}

      <section className="card dashboard-section-card training-australia-card">
        <div className="training-section-heading">
          <div>
            <span className="small">Australia</span>
            <h2>Australian specialisations</h2>
            <p>Choose a client workflow. Each specialisation shows one clear status instead of repeating the full course chain.</p>
          </div>
        </div>

        <div className="training-specialization-grid">
          {AUSTRALIA_SPECIALIZATIONS.map((specialization) => {
            const published = specialization.courses
              .map((slug) => courses.find((course) => course.slug === slug) || null)
              .filter((course): course is TrainingCourseSummary => Boolean(course));
            const next = published.find((course) => !course.completedAt) || null;
            const allExpectedPublished = published.length === specialization.courses.length;
            const allComplete = allExpectedPublished && published.every((course) => Boolean(course.completedAt));
            const status = allComplete ? "Completed" : next ? "Available" : "Specialist-review pending";

            return (
              <article className="training-specialization" key={specialization.slug}>
                <div>
                  <div className="training-specialization-top">
                    <h3>{specialization.title}</h3>
                    <span className={`training-specialization-status ${status === "Completed" ? "is-complete" : status === "Available" ? "is-available" : "is-pending"}`}>
                      {status === "Completed" ? <CheckCircle2 size={13} /> : status === "Available" ? <Sparkles size={13} /> : <LockKeyhole size={13} />}
                      {status}
                    </span>
                  </div>
                  <p>{specialization.bestFor}</p>
                  {next ? <small>Next: {next.title}</small> : null}
                </div>
                {next ? (
                  next.enrolled ? (
                    <Link className="btn btn-sm" href={nextCourseHref(next)}>Open next</Link>
                  ) : (
                    <form action={startTrainingCourseAction}>
                      <input type="hidden" name="course_id" value={next.id} />
                      <button className="btn btn-sm" type="submit">Start next</button>
                    </form>
                  )
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {completed.length ? (
        <section className="training-home-section" aria-labelledby="recently-completed-title">
          <div className="training-section-heading">
            <div>
              <span className="small">Recently completed</span>
              <h2 id="recently-completed-title">Finished courses</h2>
            </div>
          </div>
          <div className="training-course-grid">
            {completed.slice(0, 4).map((course) => <CourseCard course={course} mode="completed" key={course.id} />)}
          </div>
        </section>
      ) : null}

      <section className="training-home-section" aria-labelledby="course-library-title">
        <div className="training-section-heading training-library-heading">
          <div>
            <span className="small">Not started</span>
            <h2 id="course-library-title">Explore courses</h2>
            <p>Each course appears once. Filter the library without duplicating Australia or learning-path listings.</p>
          </div>
        </div>

        <nav className="training-filter-tabs" aria-label="Course filters">
          {FILTERS.map(([key, label]) => (
            <Link
              className={filter === key ? "is-active" : ""}
              href={key === "all" ? "/workspace/training#course-library-title" : `/workspace/training?filter=${key}#course-library-title`}
              key={key}
              aria-current={filter === key ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {filteredNotStarted.length ? (
          <div className="training-course-grid">
            {filteredNotStarted.map((course) => <CourseCard course={course} mode="not-started" key={course.id} />)}
          </div>
        ) : (
          <div className="dashboard-caught-up">
            <GraduationCap size={22} />
            <div>
              <strong>No not-started courses in this filter.</strong>
              <p>Try another filter or continue one of your active courses.</p>
            </div>
          </div>
        )}
      </section>

      {certificates.length ? (
        <section id="certificates" className="card dashboard-section-card training-certificates-card">
          <div className="training-section-heading">
            <div>
              <span className="small">Credentials</span>
              <h2>Your certificates</h2>
              <p>Every credential has a public verification page you can share with a client or recruiter.</p>
            </div>
          </div>

          <div className="training-certificate-list">
            {certificates.map((course) => {
              const credential = course.certificate;
              if (!credential) return null;
              const href = `/training/certificates/${credential.credential_code}`;
              return (
                <article className="training-certificate-row" key={course.id}>
                  <div className="training-certificate-icon"><Award size={18} /></div>
                  <div className="training-certificate-copy">
                    <strong>{course.title}</strong>
                    <span>Completed {dateLabel(credential.issued_at)}</span>
                    <code>{credential.credential_code}</code>
                  </div>
                  <div className="training-certificate-actions">
                    <Link className="btn btn-sm" href={href} target="_blank">Verify credential</Link>
                    <TrainingCertificateActions href={href} courseTitle={course.title} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
