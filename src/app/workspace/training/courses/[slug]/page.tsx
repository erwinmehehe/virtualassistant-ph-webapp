import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileCheck2, Inbox, ListChecks, Plane } from "lucide-react";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { getTrainingCourse } from "@/lib/training";
import { startTrainingCourseAction } from "@/app/actions/training";

function reviewedLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Last reviewed ${new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(date)}`;
}

export default async function TrainingCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await requireAuthenticatedUserFast(`/workspace/training/courses/${slug}`);
  const { course, error } = await getTrainingCourse(slug, userId);
  if (!course && !error) notFound();

  if (!course) {
    return <div className="dash-page"><section className="card dashboard-section-card"><h1>Course unavailable</h1><p className="muted">We could not load this course right now.</p><Link className="btn" href="/workspace/training">Back to My learning</Link></section></div>;
  }

  const orderedLessons = course.modules.flatMap((module) => module.lessons);
  const nextLesson = orderedLessons.find((lesson) => !lesson.completed) || null;
  const nextAssessment = course.assessments.find((assessment) => {
    const latest = assessment.latestSubmission || null;
    return !(
      latest?.status === "reviewed" &&
      (assessment.pass_score === null ||
        (latest.score !== null && Number(latest.score) >= assessment.pass_score))
    );
  }) || null;
  const credentialHref = course.certificate
    ? `/training/certificates/${course.certificate.credential_code}`
    : null;
  const reviewLabel = reviewedLabel(course.last_reviewed_at);
  const isExecutiveCourse = course.slug === "executive-virtual-assistant";
  const isCustomerSupportCourse = course.slug === "customer-support-virtual-assistant";
  const isOperationsCourse = course.slug === "operations-virtual-assistant";
  const isProjectCourse = course.slug === "project-management-for-virtual-assistants";
  const isSeoCourse = course.slug === "seo-virtual-assistant";
  const isMarketingCourse = course.slug === "marketing-virtual-assistant";
  const isEcommerceCourse = course.slug === "ecommerce-virtual-assistant";
  const isSocialCourse = course.slug === "social-media-virtual-assistant";
  const courseVariant = isExecutiveCourse
    ? " training-executive-course"
    : isCustomerSupportCourse
      ? " training-support-course"
      : isOperationsCourse
        ? " training-work-course training-operations-course"
        : isProjectCourse
          ? " training-work-course training-project-course"
          : isSeoCourse
            ? " training-work-course training-seo-course"
            : isMarketingCourse
              ? " training-work-course training-marketing-course"
              : isEcommerceCourse
                ? " training-work-course training-ecommerce-course"
                : isSocialCourse
                  ? " training-work-course training-social-course"
                  : "";
  const hasPracticalFinal = course.assessments.some((assessment) => assessment.assessment_type === "practical");

  return (
    <div className={`dash-page role-overview training-home training-course-page${courseVariant}`}>
      <Link className="btn btn-sm training-course-back" href="/workspace/training"><ArrowLeft size={14}/> My learning</Link>

      <section className="card dashboard-section-card training-course-hero">
        <div className="dash-kicker">{course.category}{course.country_focus ? ` · ${course.country_focus}` : ""}</div>
        <h1>{course.title}</h1>
        <p className="training-course-summary">{course.summary}</p>

        <div className="row wrap training-course-meta-row">
          <span className="badge"><Clock3 size={13}/> {course.lessonCount} lessons</span>
          {reviewLabel ? <span className="badge">{reviewLabel}</span> : null}
          {course.reviewed_by ? <span className="badge">Reviewed by {course.reviewed_by}</span> : null}
        </div>

        {isExecutiveCourse ? (
          <div className="training-executive-outcomes" aria-label="Executive VA course work outputs">
            <div className="training-executive-outcomes-head">
              <span>What you will actually build</span>
              <strong>Executive desk artifacts you can reuse on real client work</strong>
            </div>
            <div className="training-executive-outcome-grid">
              <div><Inbox size={17}/><span><strong>Inbox + decision queue</strong><small>Triage, draft, route, and surface decisions.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Calendar + meeting briefs</strong><small>Protect time, preparation, and follow-through.</small></span></div>
              <div><Plane size={17}/><span><strong>Travel + disruption plan</strong><small>Handle changes without inventing authority.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Daily handoff</strong><small>Leave owners, risks, deadlines, and next steps clear.</small></span></div>
            </div>
          </div>
        ) : null}

        {isCustomerSupportCourse ? (
          <div className="training-support-outcomes" aria-label="Customer Support VA course work outputs">
            <div className="training-support-outcomes-head">
              <span>What you will actually build</span>
              <strong>Support artifacts you can use during a real queue shift</strong>
            </div>
            <div className="training-support-outcome-grid">
              <div><Inbox size={17}/><span><strong>Queue triage board</strong><small>Prioritise by consequence, SLA, and ownership.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Reply + case record</strong><small>Write clear customer responses and internal notes.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Policy + escalation control</strong><small>Handle refunds, security, and exceptions safely.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>QA + shift handoff</strong><small>Leave every unresolved case owned and traceable.</small></span></div>
            </div>
          </div>
        ) : null}

        {isOperationsCourse ? (
          <div className="training-work-outcomes" aria-label="Operations VA course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>An operations control pack for recurring work, exceptions, and handoffs</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><ListChecks size={17}/><span><strong>Process + SOP controls</strong><small>Map triggers, owners, steps, controls, and exceptions.</small></span></div>
              <div><Inbox size={17}/><span><strong>Exception + dependency board</strong><small>Surface blocked work, owners, deadlines, and decisions.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>KPI + reconciliation pack</strong><small>Compare records, quantify variance, and preserve evidence.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Incident + shift handoff</strong><small>Keep BAU moving while failures are controlled and owned.</small></span></div>
            </div>
          </div>
        ) : null}

        {isProjectCourse ? (
          <div className="training-work-outcomes" aria-label="Project Management VA course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A project control pack for scope, delivery, risk, and closeout</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Charter + scope baseline</strong><small>Define deliverables, owners, success criteria, and boundaries.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Milestone + dependency plan</strong><small>Sequence work around capacity, blockers, and real dates.</small></span></div>
              <div><Inbox size={17}/><span><strong>RAID + change control</strong><small>Keep risks, issues, decisions, and scope changes visible.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Status + handover pack</strong><small>Report progress, acceptance, rework, and closeout cleanly.</small></span></div>
            </div>
          </div>
        ) : null}

        {isSeoCourse ? (
          <div className="training-work-outcomes" aria-label="SEO Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>An evidence-first SEO work pack from research through validation</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><Inbox size={17}/><span><strong>Visibility + intent diagnosis</strong><small>Separate indexing, rankings, clicks, intent, and competing URLs.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Keyword + SERP opportunity map</strong><small>Prioritise demand using business value and observed search results.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>On-page + technical QA</strong><small>Specify metadata, internal links, canonicals, redirects, and checks.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>GSC + change validation</strong><small>Report evidence, implementation status, impact, and next checks.</small></span></div>
            </div>
          </div>
        ) : null}

        {isMarketingCourse ? (
          <div className="training-work-outcomes" aria-label="Marketing Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A campaign operations pack from brief through launch and reporting</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Campaign brief + claim register</strong><small>Keep objectives, audiences, offers, sources, and approvals explicit.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Content + production board</strong><small>Track assets, owners, dependencies, reviews, and publish status.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Launch + asset QA</strong><small>Validate copy, links, forms, tracking, approvals, and final versions.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>CRM + campaign reporting</strong><small>Route responses, preserve campaign data, and report with clear definitions.</small></span></div>
            </div>
          </div>
        ) : null}

        {isEcommerceCourse ? (
          <div className="training-work-outcomes" aria-label="E-commerce Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A store operations pack for catalog, orders, inventory, and promotion control</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Catalog + SKU control</strong><small>Keep product identity, variants, source data, and listings consistent.</small></span></div>
              <div><Inbox size={17}/><span><strong>Order + fulfilment exception queue</strong><small>Track payment, shipping, returns, support, and next ownership.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Inventory + promotion QA</strong><small>Investigate stock mismatches and stop unsafe campaign launches.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Store reporting + handoff</strong><small>Reconcile marketplace signals, risks, metrics, and unresolved work.</small></span></div>
            </div>
          </div>
        ) : null}

        {isSocialCourse ? (
          <div className="training-work-outcomes" aria-label="Social Media Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A social operations pack for planning, publishing, moderation, and reporting</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><CalendarDays size={17}/><span><strong>Content + approval calendar</strong><small>Track formats, assets, captions, owners, rights, and approvals.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Publishing + asset QA</strong><small>Check final creative, copy, links, platform setup, and scheduled versions.</small></span></div>
              <div><Inbox size={17}/><span><strong>Moderation + escalation log</strong><small>Handle comments and complaints without exposing private data or inventing policy.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Performance + handoff report</strong><small>Summarize results, context, unresolved risks, and next actions.</small></span></div>
            </div>
          </div>
        ) : null}

        {course.trademark_disclaimer ? <div className="notice" role="note"><strong>About this course.</strong> {course.trademark_disclaimer}</div> : null}

        <div className="row-between training-course-progress-row">
          <div>
            <strong>{course.progressPercent}% complete</strong>
            <div className="small muted">{course.completedLessons} of {course.lessonCount} lessons</div>
          </div>
          {!course.enrolled ? (
            <form action={startTrainingCourseAction}>
              <input type="hidden" name="course_id" value={course.id}/>
              <button className="btn btn-primary" type="submit" data-track="training_course_start_click">Start first lesson <ArrowRight size={14}/></button>
            </form>
          ) : course.completedAt && credentialHref ? (
            <Link className="btn btn-primary" href={credentialHref} data-track="training_certificate_open">View certificate <ArrowRight size={14}/></Link>
          ) : nextLesson ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/lessons/${nextLesson.id}`} data-track="training_course_continue">
              {course.lessonCount - course.completedLessons === 1 ? "Finish last lesson" : "Continue lesson"} <ArrowRight size={14}/>
            </Link>
          ) : nextAssessment ? (
            <Link className="btn btn-primary" href={`/workspace/training/courses/${course.slug}/assessments/${nextAssessment.id}`} data-track="training_assessment_open">Start final check <ArrowRight size={14}/></Link>
          ) : course.completedAt ? (
            <div className="row wrap">
              <span className="badge">Completion saved · Certificate preparing</span>
              <Link className="btn" href="/workspace/training">My learning</Link>
            </div>
          ) : (
            <Link className="btn" href="/workspace/training">My learning</Link>
          )}
        </div>
        <div className="progress training-course-progress-bar" aria-label={`${course.progressPercent}% complete`}><span style={{ width: `${course.progressPercent}%` }}/></div>
      </section>

      {course.modules.map((module) => (
        <section className="card dashboard-section-card training-module-card" key={module.id}>
          <div className="dashboard-section-head training-module-head">
            <div>
              <span className="small training-module-label">Module {module.position}</span>
              <h2>{module.title}</h2>
              {module.summary ? <p>{module.summary}</p> : null}
            </div>
          </div>
          <div className="dash-actions training-module-lessons">
            {module.lessons.map((lesson) => {
              const isNextLesson = nextLesson?.id === lesson.id;
              return (
                <Link
                  className={[
                    "dash-action",
                    "training-lesson-row",
                    lesson.completed ? "is-complete" : "",
                    isNextLesson ? "is-next" : "",
                  ].filter(Boolean).join(" ")}
                  href={`/workspace/training/courses/${course.slug}/lessons/${lesson.id}`}
                  key={lesson.id}
                  data-track="training_lesson_open"
                >
                  <span className="dash-action-count training-lesson-index">{lesson.completed ? <CheckCircle2 size={18}/> : lesson.position}</span>
                  <span className="dash-action-copy training-lesson-copy">
                    <span className="dash-action-title"><strong>{lesson.title}</strong></span>
                    <span className="training-lesson-summary">{lesson.summary || "Detailed lesson with examples and practical application."}</span>
                    <span className="training-lesson-meta"><Clock3 size={12}/>{lesson.estimated_minutes} min{isNextLesson ? " · Next lesson" : lesson.completed ? " · Completed" : ""}</span>
                  </span>
                  <ArrowRight className="training-lesson-arrow" size={16}/>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      {course.assessments.length ? (
        <section className="card dashboard-section-card training-module-card training-assessment-card">
          <div className="dashboard-section-head training-module-head"><div><h2>Final check</h2><p>{hasPracticalFinal ? "Complete every lesson, then finish the practical work simulation to receive your certificate." : "Complete every lesson, then pass the randomized automatic knowledge check to receive your certificate."}</p></div></div>
          <div className="dash-actions training-module-lessons">
            {course.assessments.map((assessment) => {
              const latest = assessment.latestSubmission || null;
              const passed = latest?.status === "reviewed" &&
                (assessment.pass_score === null || (latest.score !== null && Number(latest.score) >= assessment.pass_score));
              const status = passed
                ? "Passed"
                : latest?.status === "needs_revision"
                  ? "Review and retry"
                  : latest?.status === "submitted"
                    ? "Processing"
                    : "Not attempted";
              return (
                <Link
                  className="dash-action training-lesson-row training-assessment-row"
                  href={`/workspace/training/courses/${course.slug}/assessments/${assessment.id}`}
                  key={assessment.id}
                  data-track="training_assessment_open"
                >
                  <span className="dash-action-count training-lesson-index">{passed ? <CheckCircle2 size={18}/> : <FileCheck2 size={17}/>}</span>
                  <span className="dash-action-copy">
                    <span className="dash-action-title"><strong>{assessment.title}</strong></span>
                    <small>{assessment.assessment_type === "practical" ? "Practical work simulation" : "Randomized knowledge check"} · {status}</small>
                  </span>
                  <ArrowRight size={16}/>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
