import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  HeartPulse,
  Landmark,
  LockKeyhole,
  Sparkles,
  Wrench,
} from "lucide-react";
import { selectAustraliaSpecializationAction, startTrainingCourseAction } from "@/app/actions/training";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingDashboard, type TrainingCourseSummary } from "@/lib/training";
import {
  getAustraliaSpecialization,
  SHARED_AUSTRALIA_COURSES,
  type AustraliaSpecializationSlug,
} from "@/lib/training-specializations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function pathIcon(slug: AustraliaSpecializationSlug) {
  if (slug === "tradie-operations") return Wrench;
  if (slug === "property-management") return Building2;
  if (slug === "ndis-allied-health") return HeartPulse;
  return Landmark;
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
  if (course.nextAssessment) return "Start final check";
  if (course.nextLesson && course.lessonCount - course.completedLessons === 1) return "Finish last lesson";
  if (course.nextLesson) return "Continue lesson";
  if (course.enrolled) return "Open course";
  return "Start course";
}

function stepState(course: TrainingCourseSummary | null, index: number, nextIndex: number) {
  if (!course) return "unavailable";
  if (course.completedAt) return "complete";
  if (index === nextIndex) return course.enrolled ? "active" : "next";
  if (course.enrolled || course.completedLessons > 0) return "active";
  return index > nextIndex ? "locked" : "not-started";
}

export default async function TrainingLearningPathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const specialization = getAustraliaSpecialization(slug);
  if (!specialization) notFound();

  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/paths/${slug}`);
  const { courses, learnerPreferences, error } = await getTrainingDashboard(userId);

  if (error) {
    return (
      <div className="dash-page role-overview training-home training-path-detail-page">
        <Link className="btn btn-sm" href="/workspace/training">
          <ArrowLeft size={14}/> Back to training
        </Link>
        <section className="card dashboard-section-card">
          <h1>Learning path unavailable</h1>
          <p className="muted">We could not load your training progress right now.</p>
        </section>
      </div>
    );
  }

  const pathCourses = specialization.courses.map(
    (courseSlug) => courses.find((course) => course.slug === courseSlug) || null,
  );
  const publishedCourses = pathCourses.filter(
    (course): course is TrainingCourseSummary => Boolean(course),
  );
  const completedCount = publishedCourses.filter((course) => Boolean(course.completedAt)).length;
  const totalMinutes = publishedCourses.reduce((sum, course) => sum + course.estimated_minutes, 0);
  const nextIndex = pathCourses.findIndex((course) => course && !course.completedAt);
  const nextCourse = nextIndex >= 0 ? pathCourses[nextIndex] : null;
  const selected = learnerPreferences?.australiaSpecialization === specialization.slug;
  const allPublished = publishedCourses.length === specialization.courses.length;
  const complete = allPublished && publishedCourses.every((course) => Boolean(course.completedAt));
  const progressPercent = publishedCourses.length
    ? Math.round((completedCount / publishedCourses.length) * 100)
    : 0;
  const sharedComplete = publishedCourses.filter(
    (course) => SHARED_AUSTRALIA_COURSES.has(course.slug) && course.completedAt,
  ).length;
  const Icon = pathIcon(specialization.slug);

  return (
    <div className={`dash-page role-overview training-home training-path-detail-page path-${specialization.slug}`}>
      <Link className="btn btn-sm" href="/workspace/training">
        <ArrowLeft size={14}/> Back to training
      </Link>

      <section className="card dashboard-section-card training-path-detail-hero">
        <div className="training-path-detail-hero-grid">
          <div className="training-path-detail-copy">
            <div className="training-path-detail-eyebrow">
              <Compass size={14}/> Australian specialisation
            </div>
            <h1>{specialization.title}</h1>
            <p>{specialization.bestFor}</p>

            <div className="training-path-detail-meta">
              <span><BookOpenCheck size={14}/>{publishedCourses.length} courses</span>
              <span><Clock3 size={14}/>{duration(totalMinutes)}</span>
              <span>{completedCount}/{publishedCourses.length} complete</span>
              {sharedComplete ? <span>{sharedComplete} shared {sharedComplete === 1 ? "course" : "courses"} already count</span> : null}
            </div>

            <div className="training-path-detail-actions">
              {complete ? (
                <Link className="btn btn-primary" href="/workspace/training#certificates">
                  Review credentials <ArrowRight size={14}/>
                </Link>
              ) : selected && nextCourse ? (
                nextCourse.enrolled ? (
                  <Link className="btn btn-primary" href={nextCourseHref(nextCourse)}>
                    {nextCourseLabel(nextCourse)} <ArrowRight size={14}/>
                  </Link>
                ) : (
                  <form action={startTrainingCourseAction}>
                    <input type="hidden" name="course_id" value={nextCourse.id}/>
                    <button className="btn btn-primary" type="submit">
                      Start next course <ArrowRight size={14}/>
                    </button>
                  </form>
                )
              ) : (
                <form action={selectAustraliaSpecializationAction}>
                  <input type="hidden" name="specialization_slug" value={specialization.slug}/>
                  <button className="btn btn-primary" type="submit">
                    {learnerPreferences?.australiaSpecialization ? "Switch to this path" : "Choose this path"} <ArrowRight size={14}/>
                  </button>
                </form>
              )}
              <Link className="btn" href="/workspace/training?browse=1#course-library-title">
                Browse all courses
              </Link>
            </div>
          </div>

          <aside className="training-path-detail-status" aria-label="Learning path progress">
            <div className="training-path-detail-icon" aria-hidden="true"><Icon size={24}/></div>
            <div className="training-path-detail-state">
              <span>{complete ? "Path complete" : selected ? "Your selected path" : "Learning path"}</span>
              <strong>{complete ? "100%" : `${progressPercent}%`}</strong>
            </div>
            <div className="progress" aria-label={`${specialization.title}: ${progressPercent}% complete`}>
              <span style={{ width: `${progressPercent}%` }}/>
            </div>
            <small>
              {complete
                ? "Every published course in this path is complete."
                : nextCourse
                  ? `Next: ${nextCourse.title}`
                  : "More course content is being prepared."}
            </small>
          </aside>
        </div>
      </section>

      <section className="card dashboard-section-card training-path-outcomes">
        <div className="training-section-heading">
          <div>
            <span className="small">What this path builds</span>
            <h2>Practical workflows, not just theory</h2>
            <p>Each course builds on the previous one so the work feels connected to a real client operation.</p>
          </div>
        </div>
        <div className="training-path-outcome-grid">
          {specialization.outcomes.map((outcome, index) => (
            <div className="training-path-outcome" key={outcome}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{outcome}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="training-path-sequence" aria-labelledby="path-sequence-title">
        <div className="training-section-heading">
          <div>
            <span className="small">Course sequence</span>
            <h2 id="path-sequence-title">Follow the path in order</h2>
            <p>Shared foundations count across specialisations. You only need to complete them once.</p>
          </div>
        </div>

        <ol className="training-path-detail-steps">
          {pathCourses.map((course, index) => {
            const state = stepState(course, index, nextIndex);
            const shared = course ? SHARED_AUSTRALIA_COURSES.has(course.slug) : false;
            return (
              <li className={`training-path-detail-step is-${state}`} key={specialization.courses[index]}>
                <div className="training-path-detail-step-rail">
                  <span className="training-path-detail-step-number">
                    {course?.completedAt ? <CheckCircle2 size={15}/> : index + 1}
                  </span>
                  {index < pathCourses.length - 1 ? <span className="training-path-detail-step-line" aria-hidden="true"/> : null}
                </div>

                <article className="training-path-detail-course">
                  <div className="training-path-detail-course-head">
                    <div>
                      <span className="training-path-detail-course-kicker">
                        {shared ? "Shared foundation" : `Step ${index + 1}`}
                      </span>
                      <h3>{course?.title || "Course coming soon"}</h3>
                    </div>
                    <span className={`training-path-detail-course-state is-${state}`}>
                      {state === "complete"
                        ? "Completed"
                        : state === "active"
                          ? "In progress"
                          : state === "next"
                            ? "Up next"
                            : state === "locked"
                              ? "Later"
                              : "Coming soon"}
                    </span>
                  </div>

                  {course ? (
                    <>
                      <p>{course.summary || "Practical training for this workflow."}</p>
                      <div className="training-path-detail-course-meta">
                        <span><BookOpenCheck size={13}/>{course.lessonCount} lessons</span>
                        <span><Clock3 size={13}/>{duration(course.estimated_minutes)}</span>
                        <span>{course.progressPercent}% complete</span>
                      </div>

                      <div className="training-path-detail-course-footer">
                        {state === "locked" ? (
                          <span className="training-path-detail-lock"><LockKeyhole size={13}/> Complete the earlier step first</span>
                        ) : course.completedAt ? (
                          <Link className="btn btn-sm" href={`/workspace/training/courses/${course.slug}`}>
                            Review course <ArrowRight size={13}/>
                          </Link>
                        ) : course.enrolled ? (
                          <Link className="btn btn-sm btn-primary" href={nextCourseHref(course)}>
                            {nextCourseLabel(course)} <ArrowRight size={13}/>
                          </Link>
                        ) : index === nextIndex ? (
                          selected ? (
                            <form action={startTrainingCourseAction}>
                              <input type="hidden" name="course_id" value={course.id}/>
                              <button className="btn btn-sm btn-primary" type="submit">
                                Start course <ArrowRight size={13}/>
                              </button>
                            </form>
                          ) : (
                            <form action={selectAustraliaSpecializationAction}>
                              <input type="hidden" name="specialization_slug" value={specialization.slug}/>
                              <button className="btn btn-sm btn-primary" type="submit">
                                Choose path and start <ArrowRight size={13}/>
                              </button>
                            </form>
                          )
                        ) : (
                          <span className="training-path-detail-lock"><LockKeyhole size={13}/> Follow the sequence</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p>This step is not published yet. It will appear here automatically when ready.</p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      {!complete && nextCourse ? (
        <section className="card dashboard-section-card training-path-next-card">
          <div className="training-path-next-icon"><Sparkles size={20}/></div>
          <div>
            <span className="small">Your next move</span>
            <h2>{nextCourse.title}</h2>
            <p>{selected ? "Keep the momentum going with the next course in your selected path." : "Choose this path to start the next available course."}</p>
          </div>
          {selected && nextCourse.enrolled ? (
            <Link className="btn btn-primary" href={nextCourseHref(nextCourse)}>
              {nextCourseLabel(nextCourse)} <ArrowRight size={14}/>
            </Link>
          ) : selected ? (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={nextCourse.id}/>
              <button className="btn btn-primary" type="submit">
                Start next course <ArrowRight size={14}/>
              </button>
            </form>
          ) : (
            <form action={selectAustraliaSpecializationAction}>
              <input type="hidden" name="specialization_slug" value={specialization.slug}/>
              <button className="btn btn-primary" type="submit">
                Choose path <ArrowRight size={14}/>
              </button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
