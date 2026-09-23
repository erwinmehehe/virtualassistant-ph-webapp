import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, Clock3, GraduationCap } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingDashboard } from "@/lib/training";
import { startTrainingCourseAction } from "@/app/actions/training";

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export default async function TrainingDashboardPage() {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const { courses, paths, error } = await getTrainingDashboard(userId);
  const enrolled = courses.filter((course) => course.enrolled);
  const active = enrolled.filter((course) => !course.completedAt);
  const certificates = courses.filter((course) => course.certificate && !course.certificate.revoked_at);
  const pathCourseIds = new Set(paths.flatMap((path) => path.courses.map((course) => course.id)));
  const generalCourses = courses.filter((course) => !pathCourseIds.has(course.id));

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Free for Filipino VAs"
        title="Training"
        subtitle={<>Practical, detailed learning you can use anywhere. Training is separate from hiring, never required for shortlisting, and certificates are free.</>}
      />

      <section className="dashboard-next-action" aria-labelledby="training-principle-title">
        <div className="dashboard-next-icon"><GraduationCap size={24}/></div>
        <div>
          <span className="small">Our learning principle</span>
          <h2 id="training-principle-title">Learn without joining the talent marketplace.</h2>
          <p>Your learning account, progress, and certificates stand on their own. A candidate profile is optional.</p>
        </div>
      </section>

      {error ? (
        <section className="card dashboard-section-card">
          <h2>Training setup is not active yet</h2>
          <p className="muted">The learning interface is ready, but the training database migration still needs to be applied for this environment.</p>
        </section>
      ) : null}

      <div className="va-status-grid">
        <div className="status-summary-card">
          <div className="row-between"><span>Available courses</span><BookOpenCheck size={18}/></div>
          <strong>{courses.length}</strong>
          <small>Free courses currently published</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>In progress</span><Clock3 size={18}/></div>
          <strong>{active.length}</strong>
          <small>Courses you have started</small>
        </div>
        <div className="status-summary-card">
          <div className="row-between"><span>Certificates</span><Award size={18}/></div>
          <strong>{certificates.length}</strong>
          <small>Free completion credentials</small>
        </div>
      </div>

      {active.length ? (
        <section className="card dashboard-section-card">
          <div className="dashboard-section-head">
            <div>
              <h2>Continue learning</h2>
              <p>Pick up where you left off.</p>
            </div>
          </div>
          <div className="dash-actions">
            {active.map((course) => (
              <Link className="dash-action" href={`/workspace/training/courses/${course.slug}`} key={course.id} data-track="training_course_continue">
                <span className="dash-action-count">{course.progressPercent}%</span>
                <span className="dash-action-copy">
                  <span className="dash-action-title"><strong>{course.title}</strong></span>
                  <small>{course.completedLessons} of {course.lessonCount} lessons complete</small>
                  <div className="progress" aria-label={`${course.title} ${course.progressPercent}% complete`}>
                    <span style={{ width: `${course.progressPercent}%` }}/>
                  </div>
                </span>
                <ArrowRight size={16}/>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {paths.map((learningPath) => (
        <section className="card dashboard-section-card" key={learningPath.id}>
          <div className="dashboard-section-head">
            <div>
              <span className="small">{learningPath.country_focus || "Optional learning path"}</span>
              <h2>{learningPath.title}</h2>
              <p>{learningPath.summary}</p>
            </div>
          </div>
          <div className="dash-actions">
            {learningPath.courses.map((course, index) => (
              <article className="dash-action" key={course.id}>
                <span className="dash-action-count">{index + 1}</span>
                <span className="dash-action-copy">
                  <span className="dash-action-title"><strong>{course.title}</strong><span className="badge">{course.category}</span></span>
                  <small>{course.summary || "Practical training with clear explanations and realistic exercises."}</small>
                  <small className="muted">{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · {duration(course.estimated_minutes)}</small>
                </span>
                {course.enrolled ? (
                  <Link className="btn btn-sm btn-primary" href={`/workspace/training/courses/${course.slug}`} data-track="training_course_continue">Continue</Link>
                ) : (
                  <form action={startTrainingCourseAction}>
                    <input type="hidden" name="course_id" value={course.id}/>
                    <button className="btn btn-sm btn-primary" type="submit" data-track="training_course_start_click">Start free</button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Course library</h2>
            <p>Short enough to finish, detailed enough to understand. Individual lessons can run up to 30 minutes when the topic needs it.</p>
          </div>
        </div>

        {generalCourses.length ? (
          <div className="dash-actions">
            {generalCourses.map((course) => (
              <article className="dash-action" key={course.id}>
                <span className="dash-action-count"><BookOpenCheck size={17}/></span>
                <span className="dash-action-copy">
                  <span className="dash-action-title">
                    <strong>{course.title}</strong>
                    <span className="badge">{course.category}</span>
                  </span>
                  <small>{course.summary || "Practical training with clear explanations and realistic exercises."}</small>
                  <small className="muted">{course.lessonCount} lesson{course.lessonCount === 1 ? "" : "s"} · {duration(course.estimated_minutes)}</small>
                </span>
                {course.enrolled ? (
                  <Link className="btn btn-sm btn-primary" href={`/workspace/training/courses/${course.slug}`} data-track="training_course_continue">Continue</Link>
                ) : (
                  <form action={startTrainingCourseAction}>
                    <input type="hidden" name="course_id" value={course.id}/>
                    <button className="btn btn-sm btn-primary" type="submit" data-track="training_course_start_click">Start free</button>
                  </form>
                )}
              </article>
            ))}
          </div>
        ) : !error && paths.length === 0 ? (
          <div className="dashboard-caught-up">
            <BookOpenCheck size={22}/>
            <div>
              <strong>The learning platform is ready for its first course.</strong>
              <p>No course has been published yet. Course content can now be added without changing the hiring system.</p>
            </div>
          </div>
        ) : null}
      </section>

      {certificates.length ? (
        <section id="certificates" className="card dashboard-section-card">
          <div className="dashboard-section-head"><div><h2>Your certificates</h2><p>Completion certificates are free.</p></div></div>
          <div className="compact-list">
            {certificates.map((course) => (
              <div key={course.id}>
                <span><strong>{course.title}</strong><small>Credential {course.certificate?.credential_code}</small></span>
                <Award size={16}/>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
