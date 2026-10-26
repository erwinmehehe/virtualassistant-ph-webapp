import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { requireTrainingAccessFast } from "@/lib/auth";
import { getTrainingDashboard } from "@/lib/training";
import { allowMockInterviewFixture, isMockInterviewLivePilot } from "@/lib/kiro-mock-interview-server";
import { KiroMockInterview } from "@/components/kiro-mock-interview";
import "../kiro-career-studio.css";
import "./mock-interview.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kiro Expert Panel Mock Interview | VirtualAssistant.com.ph",
  description: "Practice a fictional six-round VA interview based on your enrolled VAPH training.",
  robots: { index: false, follow: false },
};

export default async function KiroMockInterviewPage() {
  const { userId } = await requireTrainingAccessFast();
  const { courses, learnerProfile, error } = await getTrainingDashboard(userId);
  if (error) {
    return (
      <div className="dash-page kiro-career-page">
        <section className="card kiro-career-unavailable" role="status">
          <h1>Interview practice is temporarily unavailable</h1>
          <p>We could not verify your enrolled training courses. Please try again later.</p>
          <Link href="/workspace/training/coach" className="btn btn-primary">Return to Career Studio</Link>
        </section>
      </div>
    );
  }

  // Only published, genuinely enrolled courses can be used in the interview.
  const eligibleCourses = courses
    .filter((course) => course.status === "published" && course.enrolled)
    .map((course) => ({
      slug: course.slug,
      title: course.title,
      summary: course.summary || "",
    }));

  const aiPilotAvailable = isMockInterviewLivePilot(userId) || allowMockInterviewFixture();

  return (
    <div className="dash-page kiro-career-page kiro-interview-page">
      <Link className="kiro-career-back" href="/workspace/training/coach"><ArrowLeft size={16}/> Back to Kiro Career Studio</Link>
      <header className="kiro-interview-hero">
        <span className="kiro-career-eyebrow"><Sparkles size={15}/> KIro · MOCK INTERVIEW STUDIO</span>
        <h1>Practice with a virtual panel of interviewers.</h1>
        <p>Work through six fictional questions from a recruiter, a client and a senior VA trainer. Choose a course you are enrolled in, answer one question at a time and review a transparent practice rubric.</p>
        <div className="kiro-interview-boundary"><ShieldCheck size={17}/> Coaching only. No real recruiter, hiring outcome, grading or certificate changes.</div>
      </header>
      <KiroMockInterview courses={eligibleCourses} initialFocus={learnerProfile?.primaryCategory || ""} aiPilotAvailable={aiPilotAvailable}/>
      <p className="kiro-career-boundaries">Offline rehearsal keeps answers in this browser tab. If an approved AI pilot becomes available, the separate opt-in mode sends the answers you submit and limited course context to an external AI provider. Provider retention and data-use terms must be approved first. Do not enter client identities, passwords, patient records, account details or confidential documents.</p>
    </div>
  );
}
