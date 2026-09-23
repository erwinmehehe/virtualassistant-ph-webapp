import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  FileCheck2,
  GraduationCap,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";
import { getPublishedTrainingCourses } from "@/lib/public-training";
import "./va-hub.css";

export const metadata: Metadata = {
  title: "For Filipino Virtual Assistants",
  description: "Free VA training, profile building, reviewed remote jobs, and one private workspace for Filipino Virtual Assistants.",
  alternates: { canonical: canonicalPath("/for-virtual-assistants") }
};

function duration(minutes: number) {
  if (!minutes) return "Self-paced";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

const steps = [
  ["01", "Learn the work", "Use free training to practise the communication, admin, software, and workflow skills clients actually hand over."],
  ["02", "Build proof", "Create a profile with your experience, tools, work samples, schedule, preferred rate, and role-specific evidence."],
  ["03", "Apply selectively", "Use reviewed job details to decide whether the responsibilities, hours, schedule, and budget fit you."],
  ["04", "Manage the process", "Track applications, interviews, onboarding, workroom tasks, and payments from your private workspace."]
] as const;

const resources = [
  ["/blog/how-to-become-a-virtual-assistant-philippines", "How to become a Virtual Assistant in the Philippines"],
  ["/blog/virtual-assistant-skills", "Virtual Assistant skills employers look for"],
  ["/blog/virtual-assistant-resume-sample", "Virtual Assistant resume guide"],
  ["/blog/virtual-assistant-portfolio-examples", "Virtual Assistant portfolio examples"],
] as const;

export default async function ForVirtualAssistantsPage() {
  const courses = await getPublishedTrainingCourses();
  const featuredCourse = courses[0] || null;

  return <><SiteHeader/><main id="main-content" className="va-hub">
    <section className="va-hub-hero">
      <div className="container va-hub-hero-grid">
        <div className="va-hub-hero-copy">
          <span className="va-hub-kicker">For Filipino Virtual Assistants</span>
          <h1>Learn the work. Build proof. Find roles that fit.</h1>
          <p>Training, job search, and your candidate profile should support each other without becoming one confusing funnel. Start where you are today.</p>
          <div className="va-hub-actions">
            <Link className="btn btn-primary btn-lg" href="/training">Explore free training <ArrowRight size={16}/></Link>
            <Link className="btn btn-lg" href="/auth/join/va">Create your VA profile</Link>
          </div>
          <p className="va-hub-login">Already have an account? <Link href="/auth/login?next=%2Fworkspace%2Fva">Open your VA workspace</Link></p>
          <div className="va-hub-trust">
            <span><Check size={15}/> No course fee</span>
            <span><Check size={15}/> No application fee</span>
            <span><Check size={15}/> Training is optional for hiring</span>
          </div>
        </div>

        <aside className="va-hub-path" aria-label="Virtual Assistant path">
          <div className="va-hub-path-head">
            <span>Your VA path</span>
            <strong>One clear next step at a time.</strong>
          </div>
          <Link href="/training"><span>01</span><div><strong>Learn</strong><small>Free practical training</small></div><ArrowRight size={16}/></Link>
          <Link href="/auth/join/va"><span>02</span><div><strong>Build your profile</strong><small>Experience, proof, tools, availability</small></div><ArrowRight size={16}/></Link>
          <Link href="/jobs"><span>03</span><div><strong>Find work</strong><small>Reviewed Virtual Assistant roles</small></div><ArrowRight size={16}/></Link>
          <Link href="/auth/login?next=%2Fworkspace%2Fva"><span>04</span><div><strong>Manage applications</strong><small>Interviews, workroom, payments</small></div><ArrowRight size={16}/></Link>
        </aside>
      </div>
    </section>

    <section className="va-hub-section va-hub-training">
      <div className="container">
        <div className="va-hub-section-head">
          <div>
            <span className="va-hub-kicker">Free training</span>
            <h2>Start with a course that is actually live.</h2>
          </div>
          <Link className="va-hub-text-link" href="/training">View training hub <ArrowRight size={15}/></Link>
        </div>

        {featuredCourse ? (
          <article className="va-hub-course">
            <div className="va-hub-course-main">
              <span className="va-hub-course-icon"><GraduationCap size={22}/></span>
              <div>
                <div className="va-hub-course-status">Available now</div>
                <h3>{featuredCourse.title}</h3>
                <p>{featuredCourse.summary}</p>
                <div className="va-hub-course-meta">
                  <span><BookOpenCheck size={15}/>{featuredCourse.lesson_count} lessons</span>
                  <span><FileCheck2 size={15}/>{duration(featuredCourse.estimated_minutes)}</span>
                  <span><Award size={15}/>Free completion certificate</span>
                </div>
              </div>
            </div>
            <div className="va-hub-course-action">
              <Link className="btn btn-primary" href="/training">See course details <ArrowRight size={15}/></Link>
              <small>Training does not create or publish a candidate profile.</small>
            </div>
          </article>
        ) : (
          <div className="va-hub-empty">
            <strong>New courses are being reviewed.</strong>
            <p>We only show courses here after their lessons are published and ready to take.</p>
          </div>
        )}

        {courses.length > 1 ? (
          <div className="va-hub-more-courses">
            {courses.slice(1, 4).map((course) => (
              <Link href="/training" key={course.id}>
                <strong>{course.title}</strong>
                <span>{course.lesson_count} lessons · {duration(course.estimated_minutes)}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>

    <section className="va-hub-section va-hub-next">
      <div className="container">
        <div className="va-hub-section-head va-hub-section-head-narrow">
          <div>
            <span className="va-hub-kicker">Choose your next step</span>
            <h2>You do not need to do everything at once.</h2>
            <p>Learning, applying, and building a public candidate profile are separate choices.</p>
          </div>
        </div>
        <div className="va-hub-next-list">
          <Link href="/training">
            <span className="va-hub-next-icon"><GraduationCap size={20}/></span>
            <div><strong>I want to improve my skills first.</strong><p>Start free training and save your progress without entering the talent marketplace.</p></div>
            <span>Free training <ArrowRight size={15}/></span>
          </Link>
          <Link href="/auth/join/va">
            <span className="va-hub-next-icon"><CircleUserRound size={20}/></span>
            <div><strong>I am ready to build my candidate profile.</strong><p>Add your experience, tools, work samples, availability, and preferred rate for recruiter review.</p></div>
            <span>Create profile <ArrowRight size={15}/></span>
          </Link>
          <Link href="/jobs">
            <span className="va-hub-next-icon"><BriefcaseBusiness size={20}/></span>
            <div><strong>I want to see current opportunities.</strong><p>Review responsibilities, hours, schedule, and compensation before deciding whether to apply.</p></div>
            <span>Browse jobs <ArrowRight size={15}/></span>
          </Link>
        </div>
      </div>
    </section>

    <section className="va-hub-section va-hub-process">
      <div className="container">
        <div className="va-hub-section-head va-hub-section-head-narrow">
          <div>
            <span className="va-hub-kicker">How it fits together</span>
            <h2>From learning to paid work, without fake shortcuts.</h2>
          </div>
        </div>
        <div className="va-hub-process-grid">
          {steps.map(([number, title, copy]) => (
            <div className="va-hub-process-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="va-hub-section va-hub-boundaries">
      <div className="container va-hub-boundaries-grid">
        <div>
          <span className="va-hub-kicker">What stays separate</span>
          <h2>Training is not a placement promise.</h2>
          <p>You can learn without publishing a candidate profile. You can apply for jobs without completing training. Recruiters and clients still evaluate actual experience, communication, evidence, availability, and role fit.</p>
        </div>
        <div className="va-hub-boundary-list">
          <div><ShieldCheck size={19}/><span><strong>No worker fee</strong><small>Creating a profile, applying, and receiving your agreed compensation do not require a VirtualAssistant.com.ph worker fee.</small></span></div>
          <div><BookOpenCheck size={19}/><span><strong>Training remains optional</strong><small>Courses are there to build skill and proof, not to manufacture a hiring credential.</small></span></div>
          <div><CircleUserRound size={19}/><span><strong>Public profile requires review</strong><small>A candidate profile only appears publicly after the relevant review and consent steps.</small></span></div>
        </div>
      </div>
    </section>

    <section className="va-hub-section va-hub-resources">
      <div className="container">
        <div className="va-hub-section-head">
          <div>
            <span className="va-hub-kicker">Career guides</span>
            <h2>Use a guide when you need a specific answer.</h2>
          </div>
          <Link className="va-hub-text-link" href="/resources">All VA resources <ArrowRight size={15}/></Link>
        </div>
        <div className="va-hub-resource-links">
          {resources.map(([href, title]) => <Link href={href} key={href}><span>{title}</span><ArrowRight size={15}/></Link>)}
        </div>
      </div>
    </section>

    <section className="va-hub-close">
      <div className="container va-hub-close-inner">
        <div>
          <span className="va-hub-kicker">Ready to start?</span>
          <h2>Choose the step that matches where you are now.</h2>
        </div>
        <div className="va-hub-actions">
          <Link className="btn btn-primary btn-lg" href="/training">Start with free training</Link>
          <Link className="btn btn-lg" href="/jobs">Browse VA jobs</Link>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
