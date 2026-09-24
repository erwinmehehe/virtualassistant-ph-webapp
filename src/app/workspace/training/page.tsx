import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CheckCircle2,
  Clock3,
  Compass,
  FileCheck2,
  FolderKanban,
  GraduationCap,
  Headphones,
  HeartPulse,
  Landmark,
  Megaphone,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
import { TrainingNextSteps } from "@/components/training-next-steps";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingDashboard, type TrainingCourseSummary } from "@/lib/training";
import { vaCategoryLabel } from "@/lib/constants";
import { selectAustraliaSpecializationAction, startTrainingCourseAction } from "@/app/actions/training";
import { AUSTRALIA_SPECIALIZATIONS, SHARED_AUSTRALIA_COURSES } from "@/lib/training-specializations";
import {
  getSpecialtyTrainingPath,
  recommendNextTrainingCourses,
} from "@/lib/training-recommendations";

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
  if (course.assessmentStatus === "passed") return "Final check passed";
  if (course.assessmentStatus === "in_review") return "Final check processing";
  if (course.assessmentStatus === "needs_revision") return "Review and retry";
  if (course.assessmentStatus === "ready") return "Final check ready";
  if (course.assessmentStatus === "not_required") return "No final check";
  return "Final check not started";
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
  if (course.nextAssessment) return "Open final check";
  return "Open course";
}

function AustraliaSpecializationIcon({ slug }: { slug: (typeof AUSTRALIA_SPECIALIZATIONS)[number]["slug"] }) {
  if (slug === "tradie-operations") return <Wrench size={19} />;
  if (slug === "property-management") return <Building2 size={19} />;
  if (slug === "ndis-allied-health") return <HeartPulse size={19} />;
  return <Landmark size={19} />;
}

const FILTERS = [
  ["all", "All"],
  ["foundation", "Foundation"],
  ["role", "Role"],
  ["software", "Software"],
  ["industry", "Industry"],
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
  return course.category === "skill" && course.country_focus !== "Australia";
}

function courseVisual(course: TrainingCourseSummary) {
  const slug = course.slug.toLowerCase();

  if (slug === "virtual-assistant-foundations") return { tone: "violet", icon: GraduationCap };
  if (slug.includes("real-estate") || slug.includes("property")) return { tone: "blue", icon: Building2 };
  if (slug.includes("medical") || slug.includes("health") || slug.includes("cliniko") || slug.includes("ndis")) return { tone: "rose", icon: HeartPulse };
  if (slug.includes("executive")) return { tone: "violet", icon: BriefcaseBusiness };
  if (slug.includes("marketing") || slug.includes("social-media") || slug.includes("canva") || slug.includes("pinterest") || slug.includes("content-writing")) return { tone: "pink", icon: Megaphone };
  if (slug.includes("seo")) return { tone: "cyan", icon: Search };
  if (slug.includes("customer-support") || slug.includes("reception")) return { tone: "orange", icon: Headphones };
  if (slug.includes("ecommerce") || slug.includes("airbnb")) return { tone: "amber", icon: ShoppingBag };
  if (slug.includes("bookkeeping") || slug.includes("xero") || slug.includes("myob") || slug.includes("payroll")) return { tone: "emerald", icon: Calculator };
  if (slug.includes("sales") || slug.includes("lead-generation") || slug.includes("hubspot")) return { tone: "sky", icon: Target };
  if (slug.includes("operations") || slug.includes("project-management")) return { tone: "indigo", icon: FolderKanban };
  if (slug.includes("trades") || slug.includes("servicem8")) return { tone: "amber", icon: Wrench };
  if (course.category === "industry") return { tone: "blue", icon: Building2 };
  if (course.category === "software") return { tone: "teal", icon: Wrench };
  if (course.category === "foundation") return { tone: "violet", icon: GraduationCap };
  if (course.category === "skill") return { tone: "indigo", icon: BriefcaseBusiness };

  return { tone: "slate", icon: BookOpenCheck };
}

function CourseCard({
  course,
  mode,
}: {
  course: TrainingCourseSummary;
  mode: "active" | "completed" | "not-started";
}) {
  const visual = courseVisual(course);
  const CourseIcon = visual.icon;
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
    <article className={`training-course-card tone-${visual.tone}`}>
      <div className="training-course-card-top">
        <div className="training-course-card-heading">
          <span className="training-course-icon" aria-hidden="true"><CourseIcon size={19} /></span>
          <div className="training-course-card-copy">
            <div className="training-course-eyebrow">
              <span>{course.category === "skill" ? "Role" : course.category}</span>
              {course.country_focus ? <span>{course.country_focus}</span> : null}
            </div>
            <h3>{course.title}</h3>
            <p>{course.summary || "Practical training with realistic examples, exercises, handoffs, and QA checks."}</p>
          </div>
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
  searchParams: Promise<{ filter?: string; browse?: string }>;
}) {
  const params = await searchParams;
  const filter: FilterKey = isFilterKey(params.filter) ? params.filter : "all";
  const libraryOpen = params.browse === "1" || Boolean(params.filter && params.filter !== "all");
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const { courses, learnerProfile, learnerPreferences, error } = await getTrainingDashboard(userId);

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
  const standaloneNotStarted = notStarted.filter((course) => course.country_focus !== "Australia");
  const filteredNotStarted = standaloneNotStarted.filter((course) => matchesFilter(course, filter));
  const certificates = courses
    .filter((course) => course.certificate && !course.certificate.revoked_at)
    .sort(
      (a, b) =>
        new Date(b.certificate?.issued_at || 0).getTime() -
        new Date(a.certificate?.issued_at || 0).getTime(),
    );

  const resumeCourse = active[0] || null;
  const isNewLearner = active.length === 0 && completed.length === 0;
  const foundationsCourse = courses.find((course) => course.slug === "virtual-assistant-foundations") || null;
  const specialty = learnerProfile?.primaryCategory || null;
  const recommendation = getSpecialtyTrainingPath(specialty);
  const recommendedCourses: TrainingCourseSummary[] = recommendation.slugs
    .map((slug) => courses.find((course) => course.slug === slug) || null)
    .filter((course): course is TrainingCourseSummary => Boolean(course));
  const completedRecommended = recommendedCourses.filter((course) => Boolean(course.completedAt)).length;
  const nextRecommended = recommendedCourses.find((course) => !course.completedAt) || null;
  const recommendedProgress = recommendedCourses.length
    ? Math.round((completedRecommended / recommendedCourses.length) * 100)
    : 0;
  const latestCompleted = completed[0] || null;
  const postCompletion = latestCompleted
    ? recommendNextTrainingCourses({
        courses,
        currentSlug: latestCompleted.slug,
        primaryCategory: specialty,
        australiaSpecialization: learnerPreferences?.australiaSpecialization || null,
        limit: 3,
      })
    : null;
  const postCompletionPrimary = postCompletion?.courses[0] || null;

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
      ) : isNewLearner && foundationsCourse ? (
        <section className="training-resume-card training-start-card" aria-labelledby="start-learning-title">
          <div className="training-resume-icon"><GraduationCap size={20} /></div>
          <div className="training-resume-copy">
            <span className="small">Start here</span>
            <h2 id="start-learning-title">Virtual Assistant Foundations</h2>
            <p>Build the client communication, workflow, boundaries, handoff, and QA habits that every specialisation uses.</p>
          </div>
          <form action={startTrainingCourseAction}>
            <input type="hidden" name="course_id" value={foundationsCourse.id} />
            <button className="btn btn-primary training-resume-action" type="submit" data-track="training_foundations_start">
              Start VA Foundations <ArrowRight size={15} />
            </button>
          </form>
        </section>
      ) : postCompletionPrimary && latestCompleted ? (
        <section className="training-resume-card" aria-labelledby="continue-learning-title">
          <div className="training-resume-icon"><Compass size={20} /></div>
          <div className="training-resume-copy">
            <span className="small">Next after {latestCompleted.title}</span>
            <h2 id="continue-learning-title">{postCompletionPrimary.title}</h2>
            <p>{postCompletion?.reason}</p>
          </div>
          {postCompletionPrimary.enrolled ? (
            <Link
              className="btn btn-primary training-resume-action"
              href={`/workspace/training/courses/${postCompletionPrimary.slug}`}
              data-track="training_recommendation_click"
              data-course-slug={postCompletionPrimary.slug}
              data-cta-position="dashboard_resume"
            >
              Continue <ArrowRight size={15} />
            </Link>
          ) : (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={postCompletionPrimary.id} />
              <button
                className="btn btn-primary training-resume-action"
                type="submit"
                data-track="training_recommendation_click"
                data-course-slug={postCompletionPrimary.slug}
                data-cta-position="dashboard_resume"
              >
                Start next <ArrowRight size={15} />
              </button>
            </form>
          )}
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
        subtitle={isNewLearner
          ? <>Start with the foundations, then choose a role or Australian client specialisation when you are ready. Training is free and separate from hiring.</>
          : <>Continue your current lesson, follow a recommended path, or choose one course from the library. Training remains separate from hiring and certificates are free.</>}
      />

      {error ? (
        <section className="card dashboard-section-card">
          <h2>Training setup is not active yet</h2>
          <p className="muted">The learning interface is ready, but the training database migration still needs to be applied for this environment.</p>
        </section>
      ) : null}

      {!isNewLearner ? (
        <div className="training-home-stats" aria-label="Learning summary">
          <span><strong>{active.length}</strong> active</span>
          <span><strong>{completed.length}</strong> completed</span>
          <span><strong>{certificates.length}</strong> certificates</span>
        </div>
      ) : null}

      {!active.length && latestCompleted && postCompletion?.courses.length ? (
        <TrainingNextSteps
          sourceCourseTitle={latestCompleted.title}
          title={postCompletion.title}
          reason={postCompletion.reason}
          courses={postCompletion.courses}
          compact
        />
      ) : null}

      {recommendedCourses.length && !isNewLearner ? (
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
                <span className="small">Next in your path</span>
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
        <div className="training-australia-heading">
          <span className="training-australia-eyebrow"><Compass size={14} /> Australian client work</span>
          <h2>Choose one specialisation</h2>
          <p>Pick the work you want to get good at. Shared foundations count across every path, so you do not need to complete all four.</p>
        </div>

        <div className="training-specialization-grid">
          {AUSTRALIA_SPECIALIZATIONS.map((specialization) => {
            const published = specialization.courses
              .map((slug) => courses.find((course) => course.slug === slug) || null)
              .filter((course): course is TrainingCourseSummary => Boolean(course));
            const uniqueCourses = published.filter((course) => !SHARED_AUSTRALIA_COURSES.has(course.slug));
            const signalCourses = published.filter((course) =>
              specialization.startSignals.some((slug) => slug === course.slug)
            );
            const pathSelected = learnerPreferences?.australiaSpecialization === specialization.slug;
            const hasSpecializationProgress = signalCourses.some((course) =>
              course.enrolled || Boolean(course.completedAt) || course.completedLessons > 0
            );
            const pathStarted = pathSelected || hasSpecializationProgress;
            const completedCount = published.filter((course) => Boolean(course.completedAt)).length;
            const sharedCompleted = published.filter((course) =>
              SHARED_AUSTRALIA_COURSES.has(course.slug) && Boolean(course.completedAt)
            ).length;
            const next = published.find((course) => !course.completedAt) || null;
            const allExpectedPublished = published.length === specialization.courses.length;
            const allComplete = allExpectedPublished && published.every((course) => Boolean(course.completedAt));
            const state = allComplete ? "complete" : pathStarted ? "progress" : "not-started";
            const stateLabel = allComplete ? "Completed" : pathSelected ? "Your path" : pathStarted ? "In progress" : "Not started";
            const reviewCourse = uniqueCourses[0] || published[0] || null;
            const actionLabel = pathSelected
              ? "Continue path"
              : learnerPreferences?.australiaSpecialization
                ? "Switch path"
                : pathStarted
                  ? "Continue path"
                  : "Start path";
            const pathMinutes = published.reduce((total, course) => total + course.estimated_minutes, 0);

            return (
              <article className={`training-specialization specialization-${specialization.slug} is-${state}${pathSelected ? " is-selected" : ""}`} key={specialization.slug}>
                <div className="training-specialization-header">
                  <span className={`training-specialization-icon specialization-icon-${specialization.slug}`} aria-hidden="true">
                    <AustraliaSpecializationIcon slug={specialization.slug} />
                  </span>
                  <div className="training-specialization-copy">
                    <div className="training-specialization-top">
                      <h3>{specialization.title}</h3>
                      <span className={`training-specialization-status is-${state}`}>
                        {allComplete ? <CheckCircle2 size={13} /> : null}
                        {stateLabel}
                      </span>
                    </div>
                    <p>{specialization.bestFor}</p>
                  </div>
                </div>

                <div className="training-specialization-meta">
                  <span className="training-specialization-meta-item is-courses"><BookOpenCheck size={14} /> {published.length} courses</span>
                  <span className="training-specialization-meta-item is-duration"><Clock3 size={14} /> {duration(pathMinutes)}</span>
                  {pathStarted || allComplete ? (
                    <span>{completedCount} complete</span>
                  ) : sharedCompleted ? (
                    <span>{sharedCompleted} shared {sharedCompleted === 1 ? "course" : "courses"} already count</span>
                  ) : (
                    <span>Choose this path when you are ready</span>
                  )}
                </div>

                {pathStarted && !allComplete ? (
                  <div className="progress training-specialization-progress" aria-label={`${specialization.title}: ${completedCount} of ${published.length} courses complete`}>
                    <span style={{ width: `${Math.round((completedCount / Math.max(published.length, 1)) * 100)}%` }} />
                  </div>
                ) : null}

                <div className="training-specialization-next">
                  <div>
                    <span className="small">{allComplete ? "Path finished" : pathStarted ? "Next step" : "First step"}</span>
                    <strong>{allComplete ? "Everything in this path is complete" : next?.title || "More courses are being prepared"}</strong>
                  </div>
                  {allComplete && reviewCourse ? (
                    <Link className="btn btn-sm training-specialization-start" href={`/workspace/training/courses/${reviewCourse.slug}`}>
                      Review path
                    </Link>
                  ) : next ? (
                    pathSelected && next.enrolled ? (
                      <Link className="btn btn-sm btn-primary" href={nextCourseHref(next)}>
                        Continue path <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <form action={selectAustraliaSpecializationAction}>
                        <input type="hidden" name="specialization_slug" value={specialization.slug} />
                        <button
                          className={`btn btn-sm ${pathSelected ? "btn-primary" : "training-specialization-start"}`}
                          type="submit"
                        >
                          {actionLabel} <ArrowRight size={14} />
                        </button>
                      </form>
                    )
                  ) : null}
                </div>
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
            <span className="small">Course library</span>
            <h2 id="course-library-title">Explore courses</h2>
            <p>Browse standalone role, software, and industry courses. Australian courses stay in the specialisation paths above so they are not duplicated here.</p>
          </div>
          {libraryOpen ? (
            <Link className="btn btn-sm training-library-toggle" href="/workspace/training#course-library-title">
              Hide library
            </Link>
          ) : null}
        </div>

        {libraryOpen ? (
          <>
            <nav className="training-filter-tabs" aria-label="Course filters">
              {FILTERS.map(([key, label]) => (
                <Link
                  className={filter === key ? "is-active" : ""}
                  href={key === "all"
                    ? "/workspace/training?browse=1#course-library-title"
                    : `/workspace/training?browse=1&filter=${key}#course-library-title`}
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
          </>
        ) : standaloneNotStarted.length ? (
          <div className="training-library-collapsed">
            <div className="training-library-collapsed-icon"><BookOpenCheck size={19} /></div>
            <div>
              <strong>{standaloneNotStarted.length} standalone courses available</strong>
              <p>Open the library when you want to explore beyond your current path.</p>
            </div>
            <Link className="btn btn-sm training-library-toggle" href="/workspace/training?browse=1#course-library-title">
              Browse courses <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="dashboard-caught-up">
            <CheckCircle2 size={22} />
            <div>
              <strong>You have started every standalone course.</strong>
              <p>Continue an active course or review something you already completed.</p>
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
                    <span>Completed {dateLabel(course.completedAt || credential.issued_at)}</span>
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
