import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobWizard } from "@/components/job-wizard";
import { getSessionProfile } from "@/lib/auth";
import { canonicalPath } from "@/lib/seo-url";
import { socialMetadata } from "@/lib/og";
import "./post-a-job.css";

export const metadata: Metadata = {
  title: "Post a Virtual Assistant Job Philippines | Hire Filipino VAs",
  description:
    "Post a Virtual Assistant job in the Philippines. Build your role first, preview pay and schedule, then create a free client account to continue hiring Filipino VAs.",
  alternates: { canonical: canonicalPath("/post-a-job") },
  ...socialMetadata({
    title: "Post a Virtual Assistant Job Philippines",
    description:
      "Describe the work, set the hours and budget, preview the role, then create your client account to continue.",
    path: canonicalPath("/post-a-job"),
    category: "hiring",
    eyebrow: "Hire Filipino Virtual Assistants",
    points: ["Draft first","No account wall","Clear pay & hours","Private contact details"],
  }),
};

export default async function PostAJobPage() {
  const { user, profile } = await getSessionProfile();
  const isClient = profile?.role === "client";
  const isVa = profile?.role === "va";
  const primaryHref = isClient ? "/workspace/client/jobs/new" : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="post-job-page">
        <section className="post-job-hero">
          <div className="container post-job-hero-grid">
            <div className="post-job-copy">
              <span className="post-job-kicker"><BriefcaseBusiness size={15}/> Post a VA job</span>
              <h1>{isClient ? "Post another Virtual Assistant job." : isVa ? "Looking to hire? Use a client account to post jobs." : user ? "Post a Virtual Assistant job from the right workspace." : "Describe the role. Review the posting before you sign up."}</h1>
              <p>{isClient ? "You are already signed in as a client, so there is no signup step. Open the dashboard job composer and submit the role from your account." : isVa ? "You are signed in as a Virtual Assistant. Your VA account can browse and apply to jobs; employer posting is available from a separate client account." : user ? "You are already signed in. Open your workspace to continue with the tools available to this account." : "Add the work, hours, timezone, and budget first. Your account comes later, after you review the job exactly as applicants will see it."}</p>
              <div className="post-job-proof">
                <span><CheckCircle2 size={16}/> No signup to start</span>
                <span><CheckCircle2 size={16}/> Draft saved on this device</span>
                <span><ShieldCheck size={16}/> Contact details stay private</span>
              </div>
            </div>
            <aside className="post-job-side-note">
              <span>{isClient ? "You’re signed in as a client" : isVa ? "You’re signed in as a Virtual Assistant" : user ? "You’re already signed in" : "Already have a client account?"}</span>
              <strong>{isClient ? "Post directly from your client workspace." : isVa ? "Job posting requires a client account." : user ? "Open your workspace to continue with this account." : "Open your workspace and post from there."}</strong>
              {isClient ? <Link href="/workspace/client/jobs/new">Post from client dashboard</Link> : isVa ? <Link href="/workspace/va">Go to VA workspace</Link> : user ? <Link href="/workspace">Go to workspace</Link> : <Link href="/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Sign in to post a job</Link>}
            </aside>
          </div>
        </section>

        <section className="post-job-builder">
          <div className="container">
            <div className="post-job-builder-head">
              <div>
                <span className="kicker">Your job draft</span>
                <h2>Create the job first</h2>
              </div>
              <p>Three short steps. Add more detail only when it matters.</p>
            </div>
            {isClient ? <div className="post-job-authenticated-cta">
              <strong>You already have a client account.</strong>
              <p>Skip signup and create the job directly inside your dashboard.</p>
              <Link className="btn btn-primary btn-lg" href={primaryHref!}>Post a job from my dashboard</Link>
            </div> : isVa || user ? <div className="post-job-authenticated-cta">
              <strong>This signed-in account is not a client account.</strong>
              <p>VA accounts can browse and apply to jobs. Employer job posting is kept in the client workspace.</p>
              <Link className="btn btn-primary" href={isVa ? "/workspace/va/jobs" : "/workspace"}>{isVa ? "Browse VA jobs" : "Go to workspace"}</Link>
            </div> : <div className="post-job-wizard-shell">
              <JobWizard publicMode />
            </div>}
            {!user ? <div className="post-job-after">
              <strong>What happens after the preview?</strong>
              <p>
                Create or sign in to your client account, confirm the saved draft, and submit it. If the role needs recruiter review or commercial approval, you will see that clearly after submission.
              </p>
            </div> : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
