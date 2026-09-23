import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  Clock3,
  FileCheck2,
  GraduationCap,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";
import { getPublicTrainingOverview } from "@/lib/public-training";
import "./for-virtual-assistants.css";

const META_TITLE = "For Virtual Assistants Philippines | Training & Jobs";
const META_DESCRIPTION =
  "Free VA training, reviewed remote jobs, profile tools, and career resources for Filipino Virtual Assistants. Learn, apply, and manage your work in one place.";

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
  alternates: { canonical: canonicalPath("/for-virtual-assistants") },
};

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${minutes} min`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export default async function ForVirtualAssistantsPage() {
  const { courses } = await getPublicTrainingOverview();
  const publishedCourses = courses.filter((course) => course.status === "published");
  const upcomingCourses = courses
    .filter((course) => course.status === "draft")
    .sort((a, b) => (a.recommended_order ?? 999) - (b.recommended_order ?? 999))
    .slice(0, 5);
  const featuredCourse = publishedCourses[0] || null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="va-hub">
        <section className="va-hub-hero">
          <div className="container va-hub-hero-grid">
            <div className="va-hub-hero-copy">
              <span className="va-hub-eyebrow">For Filipino Virtual Assistants</span>
              <h1>Build skills. Show your work. Apply when you are ready.</h1>
              <p>
                Use one place for practical training, your professional profile, reviewed VA jobs,
                and the tools you need after you apply.
              </p>
              <div className="va-hub-actions">
                <Link className="btn btn-primary btn-lg" href="/training">
                  Start free training <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-lg" href="/jobs">Browse VA jobs</Link>
              </div>
              <div className="va-hub-utility-links">
                <Link href="/auth/join/va">Create your VA profile</Link>
                <span aria-hidden="true">•</span>
                <Link href="/auth/login?next=%2Fworkspace%2Fva">Log in</Link>
              </div>
            </div>

            <aside className="va-hub-hero-panel" aria-label="What you can do here">
              <div className="va-hub-panel-label">Your VA workspace</div>
              <div className="va-hub-panel-item">
                <GraduationCap size={20} />
                <div><strong>Learn</strong><span>Free training with practical exercises and certificates.</span></div>
              </div>
              <div className="va-hub-panel-item">
                <CircleUserRound size={20} />
                <div><strong>Build your profile</strong><span>Show experience, tools, work samples, and availability clearly.</span></div>
              </div>
              <div className="va-hub-panel-item">
                <BriefcaseBusiness size={20} />
                <div><strong>Find work</strong><span>Browse reviewed roles and apply when the fit makes sense.</span></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="va-hub-section va-hub-section-white">
          <div className="container">
            <div className="va-hub-section-head">
              <div>
                <span className="va-hub-kicker">Free training</span>
                <h2>Start with training that is already available.</h2>
              </div>
              <Link className="va-hub-text-link" href="/training">View the training hub <ArrowRight size={15} /></Link>
            </div>

            {featuredCourse ? (
              <article className="va-course-feature">
                <div className="va-course-feature-main">
                  <div className="va-course-status"><span></span> Available now</div>
                  <h3>{featuredCourse.title}</h3>
                  <p>{featuredCourse.summary}</p>
                  <div className="va-course-meta">
                    <span><BookOpenCheck size={15} /> {featuredCourse.lesson_count} lessons</span>
                    <span><Clock3 size={15} /> {duration(featuredCourse.estimated_minutes)}</span>
                    <span><FileCheck2 size={15} /> Free certificate</span>
                  </div>
                </div>
                <div className="va-course-feature-action">
                  <Link className="btn btn-primary" href="/auth/join/training">
                    Start this course <ArrowRight size={15} />
                  </Link>
                  <Link className="va-hub-small-link" href="/auth/login?next=%2Fworkspace%2Ftraining">Already have a training account?</Link>
                </div>
              </article>
            ) : (
              <div className="va-hub-empty">The first training course is being prepared.</div>
            )}

            {publishedCourses.length > 1 ? (
              <div className="va-live-course-list">
                {publishedCourses.slice(1).map((course) => (
                  <article key={course.id}>
                    <div>
                      <strong>{course.title}</strong>
                      <span>{course.lesson_count} lessons · {duration(course.estimated_minutes)}</span>
                    </div>
                    <Link href="/auth/join/training">Start free <ArrowRight size={14} /></Link>
                  </article>
                ))}
              </div>
            ) : null}

            {upcomingCourses.length ? (
              <div className="va-upcoming">
                <span>In production</span>
                <div className="va-upcoming-list">
                  {upcomingCourses.map((course) => <span key={course.id}>{course.title}</span>)}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="va-hub-section">
          <div className="container va-hub-path-grid">
            <div className="va-hub-path-intro">
              <span className="va-hub-kicker">Choose your next move</span>
              <h2>You do not need to do everything at once.</h2>
              <p>Training, applying for work, and joining the public talent directory are separate choices.</p>
            </div>

            <div className="va-hub-paths">
              <article className="va-hub-path">
                <div className="va-hub-path-number">01</div>
                <div>
                  <h3>Learn first</h3>
                  <p>Use free training to practise the work before you apply. Training is optional and does not lock you into the marketplace.</p>
                  <Link href="/training">Explore free training <ArrowRight size={14} /></Link>
                </div>
              </article>

              <article className="va-hub-path">
                <div className="va-hub-path-number">02</div>
                <div>
                  <h3>Build your profile</h3>
                  <p>Add the experience, tools, work samples, hours, and evidence a recruiter needs to understand your fit quickly.</p>
                  <Link href="/auth/join/va">Create your VA profile <ArrowRight size={14} /></Link>
                </div>
              </article>

              <article className="va-hub-path">
                <div className="va-hub-path-number">03</div>
                <div>
                  <h3>Apply selectively</h3>
                  <p>Review the role, hours, schedule, responsibilities, and compensation before you apply.</p>
                  <Link href="/jobs">Browse VA jobs <ArrowRight size={14} /></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="va-hub-section va-hub-section-white">
          <div className="container va-hub-trust-grid">
            <div>
              <span className="va-hub-kicker">Clear boundaries</span>
              <h2>Training is not a placement gate.</h2>
              <p>
                You can use the training without becoming a public candidate. You can also apply for suitable roles
                without completing every course. Hiring still depends on experience, evidence, communication,
                availability, and role fit.
              </p>
            </div>
            <div className="va-hub-trust-points">
              <div><Check size={17} /><span>No course or certificate fee</span></div>
              <div><Check size={17} /><span>No worker placement fee</span></div>
              <div><Check size={17} /><span>Candidate profile is optional for training</span></div>
              <div><Check size={17} /><span>Private profile review before public listing</span></div>
            </div>
          </div>
        </section>

        <section className="va-hub-section">
          <div className="container va-hub-final">
            <div>
              <span className="va-hub-kicker">Already using the platform?</span>
              <h2>Go straight to your workspace.</h2>
              <p>Continue training, update your profile, check applications, or return to your current placement.</p>
            </div>
            <div className="va-hub-final-actions">
              <Link className="btn btn-primary" href="/auth/login?next=%2Fworkspace%2Fva"><LogIn size={15} /> VA workspace</Link>
              <Link className="btn" href="/auth/login?next=%2Fworkspace%2Ftraining"><GraduationCap size={15} /> Training</Link>
              <Link className="va-hub-small-link" href="/how-vetting-works"><ShieldCheck size={14} /> How profile review works</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
