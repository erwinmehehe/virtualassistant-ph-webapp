import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, GraduationCap, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { DashHeader } from "@/components/dash-ui";
import { getTrainingAccountActivation } from "@/lib/training-account-activation-server";
import { chooseTrainingActivationOpportunity } from "@/lib/training-account-activation";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TrainingAccountActivationPage() {
  const data = await getTrainingAccountActivation();
  const totals = data.totals;
  const registered = totals.registered;
  const opportunity = chooseTrainingActivationOpportunity(totals);
  const share = (value: number) => registered ? Math.round(100 * value / registered) + "%" : "—";
  const stages = [
    { label: "Registered for training", count: registered, detail: "Original training accounts, excluding deleted and anonymous users" },
    { label: "Started at least one course", count: totals.startedCourse, detail: "Unique accounts with a recorded course start" },
    { label: "Completed at least one lesson", count: totals.completedLesson, detail: "Unique accounts with saved lesson completion" },
    { label: "Completed at least one course", count: totals.completedCourse, detail: "Unique accounts with a recorded course completion" },
  ];

  return (
    <div className="dash-page role-overview">
      <DashHeader
        kicker="Learner activation"
        title="From training signup to first completion"
        subtitle={<>A privacy-safe view of the training experience, based on account origin and saved learning records. This is not an attributed marketing conversion report.</>}
        actions={<Link className="dash-btn" href="/workspace/admin/training"><ArrowLeft size={15}/> Back to Training</Link>}
      />

      {!data.available ? (
        <section className="card dashboard-section-card" role="status">
          <h2>Activation metrics unavailable</h2>
          <p className="muted">{data.reason} No partial totals are displayed.</p>
        </section>
      ) : (
        <>
          <div className="va-status-grid">
            <div className="status-summary-card">
              <div className="row-between"><span>Training registrations</span><Users size={18}/></div>
              <strong>{registered}</strong>
              <small>Non-deleted accounts that originally registered for training</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>First course started</span><BookOpenCheck size={18}/></div>
              <strong>{totals.startedCourse}</strong>
              <small>{share(totals.startedCourse)} of training registrations</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>First course completion</span><GraduationCap size={18}/></div>
              <strong>{totals.completedCourse}</strong>
              <small>{share(totals.completedCourse)} completed one or more courses</small>
            </div>
            <div className="status-summary-card">
              <div className="row-between"><span>No course start after 72h</span><Clock3 size={18}/></div>
              <strong>{totals.noStart72h}</strong>
              <small>Registered at least 72 hours ago; no course started</small>
            </div>
          </div>

          <section className="card dashboard-section-card" aria-labelledby="training-activation-funnel-title">
            <div className="dashboard-section-head">
              <div>
                <h2 id="training-activation-funnel-title">Training account activation</h2>
                <p>Each row counts unique original training accounts, not course enrolments or events. The percentage denominator is registrations.</p>
              </div>
              <span className="badge">All time</span>
            </div>
            <div className="compact-list">
              {stages.map((stage) => (
                <div key={stage.label}>
                  <span>
                    <strong>{stage.label}</strong>
                    <small>{stage.detail}</small>
                  </span>
                  <span className="badge">{stage.count} · {share(stage.count)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card dashboard-section-card" aria-labelledby="training-first-week-title">
            <div className="dashboard-section-head">
              <div>
                <h2 id="training-first-week-title">First-week course activation</h2>
                <p>Only registrations from the last {data.firstCourseSevenDay.lookbackDays} days that have had a full seven days to start a course. Recent registrations are excluded from the denominator until their week is complete.</p>
              </div>
              <span className="badge"><Clock3 size={13}/> Seven days</span>
            </div>
            <div className="va-status-grid">
              <div className="status-summary-card">
                <div className="row-between"><span>Eligible signups</span><Users size={18}/></div>
                <strong>{data.firstCourseSevenDay.eligible}</strong>
                <small>Full seven-day observation window</small>
              </div>
              <div className="status-summary-card">
                <div className="row-between"><span>Started within seven days</span><BookOpenCheck size={18}/></div>
                <strong>{data.firstCourseSevenDay.activated}</strong>
                <small>At least one recorded course start within a week of registration</small>
              </div>
              <div className="status-summary-card">
                <div className="row-between"><span>Seven-day activation rate</span><ShieldCheck size={18}/></div>
                <strong>{data.firstCourseSevenDay.rate === null ? "No mature cohort" : data.firstCourseSevenDay.rate + "%"}</strong>
                <small>Age-matched registration cohort, not an all-time rate</small>
              </div>
              <div className="status-summary-card">
                <div className="row-between"><span>Registrations in last 30 days</span><Users size={18}/></div>
                <strong>{data.recentThirtyDayRegistrations}</strong>
                <small>Some have not yet had a full first week</small>
              </div>
            </div>
            <div className="notice">
              <strong>Largest observed gap: {opportunity.title}</strong>
              <p>{opportunity.count} account{opportunity.count === 1 ? "" : "s"} currently match this gap. {opportunity.recommendation} These are all-time stages, not proof of why individual learners stopped. Do not increase reminder volume solely based on this count.</p>
              <Link className="btn btn-sm" href={opportunity.stage === "course_start" ? "/workspace/training" : "/workspace/admin/training"}>
                {opportunity.stage === "course_start" ? "Review learner onboarding" : "Review lesson and assessment bottlenecks"} <ArrowRight size={14}/>
              </Link>
            </div>
          </section>

          <section className="card dashboard-section-card" aria-labelledby="training-va-overlap-title">
            <div className="dashboard-section-head">
              <div>
                <h2 id="training-va-overlap-title">Also created a VA candidate profile</h2>
                <p>An account is counted only if it has both an authorized VA role and an actual VA profile. Creating a candidate profile is optional and does not guarantee recruiter approval or hiring.</p>
              </div>
              <span className="badge"><UserRoundCheck size={13}/> Optional career step</span>
            </div>
            <div className="va-status-grid">
              <div className="status-summary-card">
                <div className="row-between"><span>Training accounts with VA profiles</span><UserRoundCheck size={18}/></div>
                <strong>{totals.alsoVaProfile}</strong>
                <small>{share(totals.alsoVaProfile)} of original training registrations</small>
              </div>
              <div className="status-summary-card">
                <div className="row-between"><span>Course graduates with VA profiles</span><GraduationCap size={18}/></div>
                <strong>{totals.graduatesAlsoVaProfile}</strong>
                <small>Completed a course and also have a candidate profile</small>
              </div>
            </div>
            <p className="muted">This is account overlap, not proof that training occurred before VA registration. VA roles, employment and training remain separate.</p>
          </section>
        </>
      )}
    </div>
  );
}
