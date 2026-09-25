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
  const isSalesCourse = course.slug === "sales-lead-generation-virtual-assistant";
  const isRealEstateCourse = course.slug === "real-estate-virtual-assistant";
  const isHealthcareCourse = course.slug === "medical-healthcare-virtual-assistant";
  const isBookkeepingCourse = course.slug === "bookkeeping-administration";
  const isPayrollCourse = course.slug === "payroll-administration";
  const isShortTermRentalCourse = course.slug === "airbnb-short-term-rental-virtual-assistant";
  const isServiceM8Course = course.slug === "servicem8-for-virtual-assistants";
  const isClinikoCourse = course.slug === "cliniko-for-virtual-assistants";
  const isXeroCourse = course.slug === "xero-workflows-for-virtual-assistants";
  const isMyobCourse = course.slug === "myob-workflows-for-virtual-assistants";
  const isAustralianFundamentalsCourse = course.slug === "australian-va-fundamentals";
  const isAustralianTradesCourse = course.slug === "australian-trades-administration";
  const isNdisCourse = course.slug === "ndis-administration-fundamentals";
  const isPropertyManagementCourse = course.slug === "property-management-administration-australia";
  const isMortgageBrokingCourse = course.slug === "mortgage-broking-administration-australia";
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
                  : isSalesCourse
                    ? " training-work-course training-sales-course"
                    : isRealEstateCourse
                      ? " training-work-course training-real-estate-course"
                      : isHealthcareCourse
                        ? " training-work-course training-healthcare-course"
                        : isBookkeepingCourse
                          ? " training-work-course training-bookkeeping-course"
                          : isPayrollCourse
                            ? " training-work-course training-payroll-course"
                            : isShortTermRentalCourse
                              ? " training-work-course training-rental-course"
                              : isServiceM8Course
                                ? " training-work-course training-servicem8-course"
                                : isClinikoCourse
                                  ? " training-work-course training-cliniko-course"
                                  : isXeroCourse
                                    ? " training-work-course training-xero-course"
                                    : isMyobCourse
                                      ? " training-work-course training-myob-course"
                                      : isAustralianFundamentalsCourse
                                        ? " training-work-course training-australia-fundamentals-course"
                                        : isAustralianTradesCourse
                                          ? " training-work-course training-australia-trades-course"
                                          : isNdisCourse
                                            ? " training-work-course training-ndis-course"
                                            : isPropertyManagementCourse
                                              ? " training-work-course training-property-management-course"
                                              : isMortgageBrokingCourse
                                                ? " training-work-course training-mortgage-broking-course"
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

        {isSalesCourse ? (
          <div className="training-work-outcomes" aria-label="Sales and Lead Generation Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A sales-support control pack from prospect research through pipeline handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>ICP + prospect research pack</strong><small>Define fit, verify business data, record sources, and separate facts from inference.</small></span></div>
              <div><ListChecks size={17}/><span><strong>CRM + sequence control</strong><small>Deduplicate records, preserve suppression, prepare outreach, and triage replies.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Qualification + booking handoff</strong><small>Capture approved criteria, meeting context, time zones, and unresolved questions.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Pipeline + funnel report</strong><small>Keep stages, owners, next actions, risks, and conversion signals honest.</small></span></div>
            </div>
          </div>
        ) : null}

        {isRealEstateCourse ? (
          <div className="training-work-outcomes" aria-label="Real Estate Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A real-estate operations pack for enquiries, listings, transactions, and property support</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><Inbox size={17}/><span><strong>Lead + CRM action queue</strong><small>Capture enquiries, preserve source evidence, remove duplicates, and assign next actions.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Listing + property QA pack</strong><small>Validate property facts, assets, approvals, and source-of-truth records before publishing.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Viewing + transaction tracker</strong><small>Coordinate appointments, documents, deadlines, owners, and unresolved dependencies.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Maintenance + daily handoff</strong><small>Structure requests, route restricted decisions, and leave every exception owned.</small></span></div>
            </div>
          </div>
        ) : null}

        {isHealthcareCourse ? (
          <div className="training-work-outcomes" aria-label="Medical and Healthcare Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A healthcare admin control pack that keeps patient work accurate, private, and correctly routed</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Patient intake + scheduling QA</strong><small>Verify identity, visit rules, prerequisites, reminders, and non-clinical notes.</small></span></div>
              <div><Inbox size={17}/><span><strong>Referral + records tracker</strong><small>Track document custody, missing items, destinations, owners, and follow-up dates.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Billing + claims exception queue</strong><small>Track approved charges, balances, remittances, denials, and escalation ownership.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Privacy-safe shift handoff</strong><small>Record status and incidents without making clinical, coding, or treatment decisions.</small></span></div>
            </div>
          </div>
        ) : null}

        {isBookkeepingCourse ? (
          <div className="training-work-outcomes" aria-label="Bookkeeping Administration course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A finance-admin control pack from source documents through month-end handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Source documents + coding queries</strong><small>Preserve evidence, flag duplicates, and route unclear accounting treatment for review.</small></span></div>
              <div><ListChecks size={17}/><span><strong>AP + payment control queue</strong><small>Track approvals, bank-detail verification, credits, due dates, and release boundaries.</small></span></div>
              <div><Inbox size={17}/><span><strong>AR + reconciliation exceptions</strong><small>Keep receipts, disputes, unmatched amounts, and bank differences visible and traceable.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Month-end + finance handoff</strong><small>Summarize unresolved items, evidence gaps, owners, and reviewer decisions without inventing advice.</small></span></div>
            </div>
          </div>
        ) : null}

        {isPayrollCourse ? (
          <div className="training-work-outcomes" aria-label="Payroll Administration course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A payroll control pack from input cutoff through approved post-payroll handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><CalendarDays size={17}/><span><strong>Timesheet + cutoff exception queue</strong><small>Track late inputs, missing approvals, unusual hours, and the cycle they affect.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Employee change register</strong><small>Control starters, leavers, bank changes, pay changes, effective dates, and approval evidence.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Pre-payroll variance + approval pack</strong><small>Review pay inputs, outliers, unresolved items, and go/no-go controls before release.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Post-payroll + query handoff</strong><small>Reconcile approved outputs, employee queries, corrections, and reapproval requirements.</small></span></div>
            </div>
          </div>
        ) : null}

        {isShortTermRentalCourse ? (
          <div className="training-work-outcomes" aria-label="Short-Term Rental Virtual Assistant course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A reservation-operations pack for guest stays, property readiness, vendors, and owner handoffs</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><CalendarDays size={17}/><span><strong>Reservation + calendar control</strong><small>Keep dates, guest details, owner blocks, and channel availability aligned.</small></span></div>
              <div><Inbox size={17}/><span><strong>Guest messaging + issue queue</strong><small>Handle arrivals, access, complaints, and commercial requests without overstepping authority.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Turnover + maintenance board</strong><small>Track cleaners, supplies, inspections, vendors, readiness risks, and emergency routing.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Owner + shift handoff</strong><small>Summarize open issues, decisions needed, property risks, and next checkpoints across properties.</small></span></div>
            </div>
          </div>
        ) : null}

        {isServiceM8Course ? (
          <div className="training-work-outcomes" aria-label="ServiceM8 for Virtual Assistants course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A field-service operations pack from job intake through completion and finance handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><Inbox size={17}/><span><strong>Job + queue control</strong><small>Keep job status, waiting queues, customer context, and next ownership accurate.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Schedule + dispatch board</strong><small>Coordinate staff, time windows, travel, access, and appointment changes.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Quote + completion evidence</strong><small>Prepare approved documents, capture job evidence, and keep exceptions visible.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Invoice + accounting handoff</strong><small>Check completion, billing readiness, payment state, and finance-system transfer.</small></span></div>
            </div>
          </div>
        ) : null}

        {isClinikoCourse ? (
          <div className="training-work-outcomes" aria-label="Cliniko for Virtual Assistants course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>An allied-health admin pack for patients, appointments, billing, privacy, and handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Patient + authority QA</strong><small>Verify identity, permissions, minimum-necessary access, and record boundaries.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Appointment + reminder control</strong><small>Coordinate practitioners, locations, appointment types, forms, and communications.</small></span></div>
              <div><Inbox size={17}/><span><strong>Invoice + payment exception queue</strong><small>Track approved billing, payment evidence, unresolved allocations, and decision owners.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Privacy + Xero handoff</strong><small>Leave clinical, refund, write-off, tax, and reconciliation decisions with authorised owners.</small></span></div>
            </div>
          </div>
        ) : null}

        {isXeroCourse ? (
          <div className="training-work-outcomes" aria-label="Xero Workflows for Virtual Assistants course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A Xero finance-admin control pack from AR and AP through month-end review</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><Inbox size={17}/><span><strong>AR + AP exception queues</strong><small>Track invoices, bills, source evidence, disputes, duplicates, and approval boundaries.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Bank + JAX reconciliation worksheet</strong><small>Verify suggested matches against evidence and leave uncertain items unresolved for review.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>GST/BAS + payroll handoff</strong><small>Prepare evidence and exceptions without making tax, statutory, or payroll decisions.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Month-end reviewer pack</strong><small>Surface anomalies, unresolved balances, evidence links, owners, and next checkpoints.</small></span></div>
            </div>
          </div>
        ) : null}

        {isMyobCourse ? (
          <div className="training-work-outcomes" aria-label="MYOB Workflows for Virtual Assistants course work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A MYOB finance-admin control pack for transactions, banking, payroll, and reporting</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Sales + purchases control queue</strong><small>Trace transactions to source documents and hold coding, pricing, credit, and payment decisions.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Bank-feed exception worksheet</strong><small>Check automatic and suggested matches, grouped settlements, transfers, and evidence gaps.</small></span></div>
              <div><Inbox size={17}/><span><strong>GST/BAS + payroll control</strong><small>Prepare exceptions while keeping STP, super, tax, and payroll authority separated.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Finance review handoff</strong><small>Package unresolved work, audit notes, owners, and review-ready reporting evidence.</small></span></div>
            </div>
          </div>
        ) : null}

        {isAustralianFundamentalsCourse ? (
          <div className="training-work-outcomes" aria-label="Australian VA Fundamentals work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually practise</span>
              <strong>A safe Australia-ready operating system for routine VA work, decisions, and handoffs</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><ListChecks size={17}/><span><strong>Decision-rights + source-of-truth map</strong><small>Separate routine actions, approvals, specialist decisions, and the system that owns each fact.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Australian communication + scheduling</strong><small>Handle dates, local terminology, time zones, daylight saving, and clear action-first messages.</small></span></div>
              <div><FileCheck2 size={17}/><span><strong>Privacy + finance-admin boundaries</strong><small>Use minimum-necessary information and recognise when GST, BAS, payroll, legal, or regulated questions need a specialist.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Decision-focused daily handoff</strong><small>Leave completed work, waiting items, risks, decisions needed, owners, and next checkpoints visible.</small></span></div>
            </div>
          </div>
        ) : null}

        {isAustralianTradesCourse ? (
          <div className="training-work-outcomes" aria-label="Australian Trades Administration work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually practise</span>
              <strong>A lead-to-review trades operations desk with safety, scheduling, commercial, and finance controls</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><Inbox size={17}/><span><strong>Enquiry + safety triage queue</strong><small>Preserve customer wording, identify urgency, escalate risk, and keep every open item owned.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Dispatch + return-visit board</strong><small>Match capability, service area, travel, duration, access, parts, and realistic customer timing.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Quote + variation + supplier control</strong><small>Track versions, approvals, parts, purchase authority, blocked jobs, and changes without accidental negotiation.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Invoice + Xero/MYOB handoff</strong><small>Close only from evidence, keep complaints visible, check payment state, and route accounting exceptions correctly.</small></span></div>
            </div>
          </div>
        ) : null}

        {isNdisCourse ? (
          <div className="training-work-outcomes" aria-label="NDIS Administration Fundamentals work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>An NDIS administration control pack that keeps evidence, authority, claims, incidents, and provider handoffs traceable</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Authority + registration evidence map</strong><small>Track participant/provider authority, current registration evidence, sources, owners, and claims without overstating status.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Roster + claim exception queues</strong><small>Reconcile service evidence, payment pathways, pricing inputs, missing records, and reviewer questions.</small></span></div>
              <div><Inbox size={17}/><span><strong>Complaint + incident escalation log</strong><small>Preserve reported wording, follow immediate escalation protocols, and keep safeguarding/reportability decisions with authorised owners.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Provider admin control board</strong><small>Surface overdue agreements, evidence gaps, claim holds, pricing questions, registration tasks, and next checkpoints.</small></span></div>
            </div>
          </div>
        ) : null}

        {isPropertyManagementCourse ? (
          <div className="training-work-outcomes" aria-label="Property Management Administration Australia work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A jurisdiction-first property-management control pack for applications, rent, maintenance, access, and tenancy handoffs</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><ListChecks size={17}/><span><strong>Jurisdiction + authority matrix</strong><small>Anchor every property workflow to the correct state, approved source, VA action, and authorised local decision owner.</small></span></div>
              <div><Inbox size={17}/><span><strong>Application + rent evidence queues</strong><small>Keep privacy, fairness, ledger exceptions, receipts, and decision boundaries visible without selecting tenants or deciding legal outcomes.</small></span></div>
              <div><CalendarDays size={17}/><span><strong>Maintenance + access control board</strong><small>Track serious-risk escalation, contractors, spend approvals, entry purpose, notices, service evidence, and inspections.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Renewal + vacate + bond handoff</strong><small>Organise condition evidence, invoices, ledger issues, proposed outcomes, owners, and jurisdiction-aware next steps.</small></span></div>
            </div>
          </div>
        ) : null}

        {isMortgageBrokingCourse ? (
          <div className="training-work-outcomes" aria-label="Mortgage Broking Administration Australia work outputs">
            <div className="training-work-outcomes-head">
              <span>What you will actually build</span>
              <strong>A mortgage-administration evidence pack from secure intake through lender conditions, settlement, and CRM handoff</strong>
            </div>
            <div className="training-work-outcome-grid">
              <div><FileCheck2 size={17}/><span><strong>Authority + secure intake controls</strong><small>Separate administrative preparation from broker-only credit judgment while keeping identity and financial documents in approved systems.</small></span></div>
              <div><ListChecks size={17}/><span><strong>Fact-find + lender research evidence</strong><small>Preserve contradictions, stale evidence, dated lender facts, and source records without improving serviceability or recommending products.</small></span></div>
              <div><Inbox size={17}/><span><strong>Application + conditions tracker</strong><small>Track packaging, disclosures, valuation, lender conditions, expiries, document status, and broker decisions without overstating approval.</small></span></div>
              <div><CheckCircle2 size={17}/><span><strong>Settlement + CRM handoff</strong><small>Confirm outcomes from authoritative sources, close dependencies, protect data, and keep post-settlement admin separate from new credit advice.</small></span></div>
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
