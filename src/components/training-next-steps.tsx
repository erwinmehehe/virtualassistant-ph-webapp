import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Compass,
  Sparkles,
} from "lucide-react";
import { startTrainingCourseAction } from "@/app/actions/training";
import type { TrainingRecommendationCourse } from "@/lib/training-recommendations";

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function categoryLabel(course: TrainingRecommendationCourse) {
  if (course.country_focus) return course.country_focus;
  if (course.category === "skill") return "Role skill";
  if (course.category === "foundation") return "Foundation";
  if (course.category === "software") return "Software";
  if (course.category === "industry") return "Industry";
  return "Training";
}

function RecommendationAction({
  course,
  primary = false,
  position,
}: {
  course: TrainingRecommendationCourse;
  primary?: boolean;
  position: string;
}) {
  if (course.enrolled) {
    return (
      <Link
        className={primary ? "btn btn-primary" : "btn btn-sm"}
        href={`/workspace/training/courses/${course.slug}`}
        data-track="training_recommendation_click"
        data-course-slug={course.slug}
        data-cta-position={position}
      >
        Continue course <ArrowRight size={14}/>
      </Link>
    );
  }

  return (
    <form action={startTrainingCourseAction}>
      <input type="hidden" name="course_id" value={course.id}/>
      <button
        className={primary ? "btn btn-primary" : "btn btn-sm"}
        type="submit"
        data-track="training_recommendation_click"
        data-course-slug={course.slug}
        data-cta-position={position}
      >
        Start course <ArrowRight size={14}/>
      </button>
    </form>
  );
}

export function TrainingNextSteps({
  sourceCourseTitle,
  title,
  reason,
  courses,
  compact = false,
}: {
  sourceCourseTitle: string;
  title: string;
  reason: string;
  courses: TrainingRecommendationCourse[];
  compact?: boolean;
}) {
  if (!courses.length) return null;

  const [primary, ...alternates] = courses;

  return (
    <section className={`card dashboard-section-card training-next-steps ${compact ? "is-compact" : ""}`}>
      <div className="training-next-steps-head">
        <span className="training-next-steps-icon"><Sparkles size={18}/></span>
        <div>
          <span className="dash-kicker">What to learn next</span>
          <h2>{title}</h2>
          <p>
            You completed <strong>{sourceCourseTitle}</strong>. {reason}
          </p>
        </div>
      </div>

      <article className="training-next-primary">
        <span className="training-next-primary-icon"><Compass size={20}/></span>
        <div className="training-next-primary-copy">
          <span className="small">Best next step</span>
          <h3>{primary.title}</h3>
          <p>{primary.summary || "Continue with the next practical workflow in this skill area."}</p>
          <div className="training-next-meta">
            <span><BookOpenCheck size={13}/>{categoryLabel(primary)}</span>
            <span><Clock3 size={13}/>{duration(primary.estimated_minutes)}</span>
            {primary.enrolled ? <span><CheckCircle2 size={13}/>Already started</span> : null}
          </div>
        </div>
        <RecommendationAction course={primary} primary position="post_completion_primary"/>
      </article>

      {alternates.length ? (
        <div className="training-next-alternates">
          <div className="training-next-alternates-head">
            <span>Other useful directions</span>
            <small>Optional, not a required path</small>
          </div>
          <div className="training-next-alternate-grid">
            {alternates.map((course, index) => (
              <article key={course.id}>
                <div>
                  <span className="small">{categoryLabel(course)}</span>
                  <h3>{course.title}</h3>
                  <p>{duration(course.estimated_minutes)} · {course.enrolled ? "In progress" : "Not started"}</p>
                </div>
                <RecommendationAction
                  course={course}
                  position={`post_completion_alternate_${index + 1}`}
                />
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <p className="training-next-steps-note">
        Recommendations help you choose what to learn next. They do not affect hiring, recruiter approval, or job access.
      </p>
    </section>
  );
}
