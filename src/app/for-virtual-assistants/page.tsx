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
import { socialMetadata } from "@/lib/og";

const META_TITLE = "For Virtual Assistants Philippines | Training & Jobs";
const META_DESCRIPTION =
  "Free VA training, reviewed remote jobs, profile tools, and career resources for Filipino Virtual Assistants. Learn, apply, and manage your work in one place.";

export const metadata: Metadata = {
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
  alternates: { canonical: canonicalPath("/for-virtual-assistants") },
  ...socialMetadata({
    title: META_TITLE,
    description: META_DESCRIPTION,
    path: canonicalPath("/for-virtual-assistants"),
    category: "training",
    eyebrow: "For Filipino Virtual Assistants",
    points: ["Free VA training", "Reviewed remote jobs", "Profile tools", "Career resources"],
  }),
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
              <h1>Build a VA profile recruiters can understand in minutes.</h1>
              <p>
                Create your free profile, complete a short setup, then add your experience, skills,
                tools, availability, and work evidence when you are ready.
              </p>
              <div className="va-hub-actions">
                <Link className="btn btn-primary btn-lg" href="/auth/join/va">
                  Create free VA profile <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-lg" href="/jobs">Browse VA jobs</Link>
              </div>
              <div className="va-hub-utility-links">
                <Link href="/auth/login?next=%2Fworkspace%2Fva">Already registered? Log in</Link>
                <span aria-hidden="true">•</span>
                <Link href="/training">Free VA training</Link>
              </div>
              <div className="va-hub-assurances" aria-label="VA account assurances">
                <span><Check size={14} /> Free to join</span>
                <span><Check size={14} /> No worker placement fee</span>
                <span><ShieldCheck size={14} /> Private until you opt in</span>
              </div>
            </div>

            <aside className="va-hub-hero-panel" aria-label="How VA registration works">
              <div className="va-hub-panel-label">How it works</div>
              <div className="va-hub-panel-step">
                <span>01</span>
                <div><strong>Create your free account</strong><small>Name, email, and a secure password. Google sign-up is available when enabled.</small></div>
              </div>
              <div className="va-hub-panel-step">
                <span>02</span>
                <div><strong>Complete the quick setup</strong><small>Add your main specialty, professional headline, experience, and weekly availability.</small></div>
              </div>
              <div className="va-hub-panel-step">
                <span>03</span>
                <div><strong>Build your profile and vetting</strong><small>Add your photo, summary, skills, tools, resume, and work-readiness evidence at your own pace.</small></div>
              </div>
              <div className="va-hub-panel-step">
                <span>04</span>
                <div><strong>Apply for suitable roles</strong><small>Review the responsibilities, hours, schedule, and compensation before you apply.</small></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="va-hub-quick-start">
          <div className="container va-hub-quick-start-grid">
            <div>
              <span className="va-hub-kicker">Start with the essentials</span>
              <h2>Your first setup is short. The detailed profile comes after.</h2>
              <p>Create the account first, then save the details recruiters need for a quick first read. You can finish the rest of your profile over time.</p>
            </div>
            <div className="va-hub-quick-list">
              <div><CircleUserRound size={18}/><span><strong>Specialty + headline</strong><small>Make your role easy to understand at a glance.</small></span></div>
              <div><BriefcaseBusiness size={18}/><span><strong>Experience + availability</strong><small>Show seniority and how much weekly capacity you have.</small></span></div>
              <div><FileCheck2 size={18}/><span><strong>Profile + evidence later</strong><small>Add your resume, tools, summary, photo, and vetting items after setup.</small></span></div>
            </div>
          </div>
        </section>

        <section className="va-hub-section va-hub-toolkit">
          <div className="container">
            <div className="va-hub-toolkit-head">
              <div>
                <span className="va-hub-kicker">Application toolkit</span>
                <h2>Build each part once. Keep the whole application consistent.</h2>
                <p>
                  Your profile, resume, portfolio, intro video, and application message should point to the same type of work.
                  Use these guides in order, then apply only where the role, hours, pay, and schedule genuinely fit.
                </p>
              </div>
              <Link className="va-hub-text-link" href="/jobs">Browse current VA jobs <ArrowRight size={15} /></Link>
            </div>

            <div className="va-hub-toolkit-grid">
              <Link href="/blog/how-to-create-the-best-va-profile">
                <span>01</span>
                <strong>Build your VA profile</strong>
                <small>Choose a clear specialty, headline, evidence, tools, and availability.</small>
                <em>Profile guide <ArrowRight size={14}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-resume-sample">
                <span>02</span>
                <strong>Prepare your resume</strong>
                <small>Show relevant work history without turning the resume into a task dump.</small>
                <em>Resume sample <ArrowRight size={14}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-portfolio-examples">
                <span>03</span>
                <strong>Add work samples</strong>
                <small>Use privacy-safe proof and clearly labelled practice projects when needed.</small>
                <em>Portfolio examples <ArrowRight size={14}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-introduction-video">
                <span>04</span>
                <strong>Record your intro video</strong>
                <small>Use a clear one-minute structure when an application asks for video.</small>
                <em>Video scripts <ArrowRight size={14}/></em>
              </Link>
              <Link href="/blog/virtual-assistant-proposal-sample">
                <span>05</span>
                <strong>Write the proposal</strong>
                <small>Connect the employer's actual workload to your most relevant evidence.</small>
                <em>Proposal samples <ArrowRight size={14}/></em>
              </Link>
              <Link href="/blog/how-to-apply-as-a-virtual-assistant">
                <span>06</span>
                <strong>Apply selectively</strong>
                <small>Check the responsibilities, hours, timezone, pay, and required tools before sending.</small>
                <em>Application guide <ArrowRight size={14}/></em>
              </Link>
            </div>

            <div className="va-hub-toolkit-foot">
              <span>Need more practice first? Training is free and optional.</span>
              <Link href="/training">Explore free VA training <ArrowRight size={14}/></Link>
            </div>
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
