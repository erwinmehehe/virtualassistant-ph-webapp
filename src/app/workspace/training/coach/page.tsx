import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Compass, GraduationCap, Sparkles } from "lucide-react";
import { requireTrainingAccessFast } from "@/lib/auth";
import { getTrainingDashboard } from "@/lib/training";
import { chooseTrainingResumeCourse } from "@/lib/training-learning-priority";
import { recommendNextTrainingCourses } from "@/lib/training-recommendations";
import { KiroCareerStudio } from "@/components/kiro-career-studio";
import "./kiro-career-studio.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kiro Career Studio | VirtualAssistant.com.ph",
  description: "Guided VA career planning, portfolio practice, resume examples and mock interview preparation for VAPH training learners.",
  robots: { index: false, follow: false },
};

export default async function KiroCareerStudioPage() {
  const { userId, profile } = await requireTrainingAccessFast();
  // Only the authenticated learner's existing course and profile facts are used.
  // Nothing from the practice editor is sent to this page's server or to an AI provider.
  const { courses, learnerProfile, learnerPreferences, error } = await getTrainingDashboard(userId);

  if (error) {
    return (
      <div className="dash-page kiro-career-page">
        <section className="card kiro-career-unavailable" role="status">
          <h1>Kiro Career Studio is temporarily unavailable</h1>
          <p>Your course data could not be loaded, so we cannot safely personalize your learning plan right now.</p>
          <Link href="/workspace/training" className="btn btn-primary">Return to my learning</Link>
        </section>
      </div>
    );
  }

  const active = chooseTrainingResumeCourse(courses);
  const latestFinished = [...courses]
    .filter((course) => Boolean(course.completedAt))
    .sort((a, b) => Date.parse(b.completedAt || "") - Date.parse(a.completedAt || ""))[0] || null;
  const recommendation = recommendNextTrainingCourses({
    courses,
    currentSlug: active?.slug || latestFinished?.slug || null,
    primaryCategory: learnerProfile?.primaryCategory || null,
    australiaSpecialization: learnerPreferences?.australiaSpecialization || null,
    limit: 3,
  });

  const completedCount = courses.filter((course) => Boolean(course.completedAt)).length;
  const activeCount = courses.filter((course) => course.enrolled && !course.completedAt).length;
  const lessonCount = courses.reduce((total, course) => total + (course.enrolled ? course.completedLessons : 0), 0);
  const nextHref = active?.nextLesson
    ? `/workspace/training/courses/${active.slug}/lessons/${active.nextLesson.id}`
    : active?.nextAssessment
      ? `/workspace/training/courses/${active.slug}/assessments/${active.nextAssessment.id}`
      : active ? `/workspace/training/courses/${active.slug}`
        : recommendation.courses[0] ? `/workspace/training/courses/${recommendation.courses[0].slug}`
          : "/workspace/training?browse=1#course-library-title";
  const nextName = active?.nextLesson?.title || active?.nextAssessment?.title ||
    active?.title || recommendation.courses[0]?.title || "Explore training courses";

  return (
    <div className="dash-page kiro-career-page">
      <Link className="kiro-career-back" href="/workspace/training"><ArrowLeft size={16}/> My learning</Link>

      <section className="kiro-career-hero" aria-labelledby="kiro-career-heading">
        <div className="kiro-career-hero-inner">
          <div className="kiro-career-identity"><Sparkles size={16}/> Kiro Career Studio <span>Guided practice</span></div>
          <h1 id="kiro-career-heading">Turn your VA training into confident next steps.</h1>
          <p>Choose a useful course, draft truthful work examples, build a practice portfolio, and rehearse fictional client interviews. Kiro uses your existing training progress to suggest where to start.</p>
          <div className="kiro-career-hero-actions">
            <a href="#career-practice" className="btn btn-primary">Open practice tools <ArrowRight size={15}/></a>
            <Link href={nextHref} className="kiro-career-hero-link">Continue learning <ArrowRight size={15}/></Link>
          </div>
        </div>
        <div className="kiro-career-hero-metrics" aria-label="Verified training activity">
          <div><CheckCircle2 size={19}/><strong>{completedCount}</strong><span>Courses completed</span></div>
          <div><BookOpenCheck size={19}/><strong>{activeCount}</strong><span>In progress</span></div>
          <div><GraduationCap size={19}/><strong>{lessonCount}</strong><span>Lessons completed</span></div>
          <small>From your VAPH training record, not a job-readiness score.</small>
        </div>
      </section>

      <div className="kiro-career-top-grid">
        <section className="kiro-career-next" aria-labelledby="career-next-title">
          <span className="kiro-career-eyebrow"><Compass size={15}/> Suggested next learning step</span>
          <h2 id="career-next-title">{nextName}</h2>
          <p>{active
            ? "Continue the training you already started. The career exercises below are optional and do not change course assessments."
            : "Start with a published course that fits your available training path."}</p>
          <Link href={nextHref} className="kiro-career-text-link">Open this step <ArrowRight size={15}/></Link>
        </section>
        <section className="kiro-career-recommendations" aria-labelledby="career-courses-title">
          <h2 id="career-courses-title">Courses to explore</h2>
          <p>{recommendation.reason}</p>
          {recommendation.courses.length ? (
            <ul>
              {recommendation.courses.map((course) => (
                <li key={course.id}>
                  <div><strong>{course.title}</strong><small>{course.enrolled ? "Already started" : "Published course"}</small></div>
                  <Link href={`/workspace/training/courses/${course.slug}`} aria-label={`Explore ${course.title}`}><ArrowRight size={16}/></Link>
                </li>
              ))}
            </ul>
          ) : <p>You've explored the available course suggestions. Browse the full catalog for more options.</p>}
        </section>
      </div>

      <section className="kiro-career-practice" id="career-practice" aria-labelledby="career-practice-title">
        <div className="kiro-career-section-heading">
          <div><span className="kiro-career-eyebrow">YOUR PRACTICE WORKSPACE</span><h2 id="career-practice-title">Build evidence you can explain in an interview.</h2></div>
          <p>Drafts stay in this browser tab and are not saved or sent to an AI service. Use fictional client details, never passwords or personal records.</p>
        </div>
        <KiroCareerStudio
          initialFocus={learnerProfile?.primaryCategory || ""}
          verifiedTools={(learnerProfile?.tools || []).slice(0, 5)}
          vaAccount={profile?.role === "va"}
        />
      </section>

      <p className="kiro-career-boundaries">
        Kiro Career Studio offers structured, rule-based guidance—not live AI responses, recruiter screening or a promise of work. Finishing training or exercises does not affect your hiring eligibility, grades or certificates. The separate AI lesson coach stays restricted until its provider review and pilot tests are approved.
      </p>
    </div>
  );
}
