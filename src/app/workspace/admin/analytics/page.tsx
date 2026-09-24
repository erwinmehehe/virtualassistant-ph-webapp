import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { BLOG_POSTS, blogHref } from "@/lib/blog";

const labels: Record<string, string> = {
  page_view: "Page views",
  hero_role_brief: "Hero to role brief",
  hero_browse_talent: "Hero to directory",
  directory_role_brief: "Directory to role brief",
  directory_profile_view: "Directory to profile",
  featured_profile_view: "Homepage to profile",
  talent_request_intro: "Profile to introduction",
  role_brief_submit: "Role brief submit clicks",
  role_brief_create_account: "Role brief to client account",
  job_apply: "VA application submit clicks",
  header_hire_va: "Header to role brief",
  account_created: "Completed account creations",
  blog_cta_match: "Blog to match request",
  blog_service_click: "Blog to service page",
  blog_related_click: "Blog to related guide",
  blog_tool_click: "Blog to free tool",
  tool_open: "Tool opens",
  tool_complete: "Tool completions",
  tool_cta_match: "Tool to hiring CTA",
  lead_submit: "Saved match requests",
  job_draft_created: "Private job drafts created",
  qualified_lead: "Client-claimed qualified leads"
};

// Only the columns the blog funnel actually correlates on. The metadata jsonb
// and created_at were being transferred for every row and used by neither.
type EventRow = {
  event_name: string;
  path: string;
  session_id: string | null;
  user_id?: string | null;
};

type TrainingCourseAnalyticsRow = {
  id: string;
  slug: string;
  title: string;
  recommended_order: number;
};

type TrainingModuleAnalyticsRow = {
  id: string;
  course_id: string;
  position: number;
};

type TrainingLessonAnalyticsRow = {
  id: string;
  module_id: string;
  title: string;
  position: number;
};

type TrainingEnrollmentAnalyticsRow = {
  user_id: string;
  course_id: string;
  completed_at: string | null;
};

type TrainingProgressAnalyticsRow = {
  user_id: string;
  lesson_id: string;
};

type TrainingAssessmentAnalyticsRow = {
  id: string;
  course_id: string;
  pass_score: number | null;
};

type TrainingSubmissionAnalyticsRow = {
  user_id: string;
  assessment_id: string;
  status: string;
  score: number | null;
};

type TrainingCertificateAnalyticsRow = {
  user_id: string;
  course_id: string;
  revoked_at: string | null;
};

type AnalyticsSummary = {
  event_counts: { event_name: string; total: number }[];
  sessions: number;
  client_accounts: number;
  role_briefs: number;
  intro_briefs: number;
  converted_leads: number;
};

const EMPTY_SUMMARY: AnalyticsSummary = { event_counts: [], sessions: 0, client_accounts: 0, role_briefs: 0, intro_briefs: 0, converted_leads: 0 };

// Funnel events are low-volume, so they are fetched whole. Page views are not,
// so they are filtered to blog paths in the database -- every blog URL is
// /blog/<slug> (see blogHref), and the global page-view total comes from the
// aggregate instead.
const FUNNEL_EVENTS = "event_name.eq.blog_service_click,event_name.eq.blog_cta_match,event_name.eq.lead_submit,event_name.eq.qualified_lead,event_name.like.service_*";

export default async function AdminAnalyticsPage() {
  await requireRoleFast("admin");
  const admin = createAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: summaryData }, { data: blogViewRows }, { data: funnelRows }, { data: trainingRows }, { data: trainingCourseData }] = await Promise.all([
    admin.rpc("admin_analytics_summary", { p_since: since }),
    admin.from("analytics_events").select("event_name,path,session_id").gte("created_at", since).eq("event_name", "page_view").like("path", "/blog%").limit(10000),
    admin.from("analytics_events").select("event_name,path,session_id").gte("created_at", since).or(FUNNEL_EVENTS).limit(10000),
    admin.from("analytics_events").select("event_name,path,session_id,user_id").gte("created_at", since).like("event_name", "training_%").limit(10000),
    admin.from("training_courses").select("id,slug,title,recommended_order").eq("status", "published").order("recommended_order").order("title")
  ]);

  const trainingCourses = (trainingCourseData || []) as TrainingCourseAnalyticsRow[];
  const trainingCourseIds = trainingCourses.map((course) => course.id);
  const [
    { data: trainingModuleData },
    { data: trainingEnrollmentData },
    { data: trainingAssessmentData },
    { data: trainingCertificateData },
  ] = trainingCourseIds.length
    ? await Promise.all([
        admin.from("training_modules").select("id,course_id,position").in("course_id", trainingCourseIds),
        admin.from("training_enrollments").select("user_id,course_id,completed_at").in("course_id", trainingCourseIds),
        admin.from("training_assessments").select("id,course_id,pass_score").in("course_id", trainingCourseIds).eq("is_published", true),
        admin.from("training_certificates").select("user_id,course_id,revoked_at").in("course_id", trainingCourseIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const trainingModules = (trainingModuleData || []) as TrainingModuleAnalyticsRow[];
  const trainingModuleIds = trainingModules.map((module) => module.id);
  const trainingAssessments = (trainingAssessmentData || []) as TrainingAssessmentAnalyticsRow[];
  const trainingAssessmentIds = trainingAssessments.map((assessment) => assessment.id);

  const [{ data: trainingLessonData }, { data: trainingSubmissionData }] = await Promise.all([
    trainingModuleIds.length
      ? admin.from("training_lessons").select("id,module_id,title,position").in("module_id", trainingModuleIds).eq("is_published", true)
      : Promise.resolve({ data: [] }),
    trainingAssessmentIds.length
      ? admin.from("training_assessment_submissions").select("user_id,assessment_id,status,score").in("assessment_id", trainingAssessmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const trainingLessons = (trainingLessonData || []) as TrainingLessonAnalyticsRow[];
  const trainingLessonIds = trainingLessons.map((lesson) => lesson.id);
  const { data: trainingProgressData } = trainingLessonIds.length
    ? await admin.from("training_lesson_progress").select("user_id,lesson_id").in("lesson_id", trainingLessonIds)
    : { data: [] };

  const summary = (summaryData || EMPTY_SUMMARY) as AnalyticsSummary;
  const blogViews = (blogViewRows || []) as EventRow[];
  const funnelEvents = (funnelRows || []) as EventRow[];
  const trainingEvents = (trainingRows || []) as EventRow[];
  const events = [...blogViews, ...funnelEvents];
  const counts = new Map<string, number>((summary.event_counts || []).map((row) => [row.event_name, Number(row.total) || 0]));
  const knownSessions = Number(summary.sessions) || 0;
  const roleBriefCount = Number(summary.role_briefs) || 0;
  const introBriefCount = Number(summary.intro_briefs) || 0;
  const convertedLeads = Number(summary.converted_leads) || 0;
  const clientAccounts = Number(summary.client_accounts) || 0;
  const pageViews = counts.get("page_view") || 0;
  const roleClicks = (counts.get("hero_role_brief") || 0) + (counts.get("directory_role_brief") || 0) + (counts.get("header_hire_va") || 0);

  const blogPaths = new Set(BLOG_POSTS.map(blogHref));
  const isBlogPath = (path: string) => path === "/blog" || path === "/blog/" || path.startsWith("/blog/") || blogPaths.has(path.endsWith("/") ? path : `${path}/`);
  const blogSessions = new Set(blogViews.filter((event) => isBlogPath(event.path) && event.session_id).map((event) => event.session_id as string));
  const fromBlogSession = (event: EventRow) => Boolean(event.session_id && blogSessions.has(event.session_id));
  const blogPageViews = blogViews.filter((event) => isBlogPath(event.path)).length;
  const blogServiceClicks = events.filter((event) => event.event_name === "blog_service_click" && fromBlogSession(event)).length;
  const blogProfileViews = events.filter((event) => /^service_[a-z0-9_]+_profile$/.test(event.event_name) && fromBlogSession(event)).length;
  const blogMatchClicks = events.filter((event) => (event.event_name === "blog_cta_match" || /^service_[a-z0-9_]+_match$/.test(event.event_name)) && fromBlogSession(event)).length;
  const blogLeadSubmits = events.filter((event) => event.event_name === "lead_submit" && (fromBlogSession(event) || isBlogPath(event.path))).length;
  const blogQualified = events.filter((event) => event.event_name === "qualified_lead" && fromBlogSession(event)).length;

  const acquisitionFunnel = [
    ["Known sessions", knownSessions, "Unique first-party session IDs recorded"],
    ["Page views", pageViews, "All recorded public page views"],
    ["Role-brief CTA clicks", roleClicks, "Tracked header, hero, and directory entry clicks"],
    ["Saved role briefs", roleBriefCount, "Server-side role brief records"],
    ["Client accounts created", clientAccounts, "Completed client signups recorded server-side"]
  ] as const;

  const contentFunnel = [
    ["Blog page views", blogPageViews, "Article and topic-hub page views"],
    ["Blog sessions", blogSessions.size, "Unique sessions that viewed blog content"],
    ["Service clicks", blogServiceClicks, "Blog visitors who clicked into a service page"],
    ["VA profile views", blogProfileViews, "Service profile clicks from blog-origin sessions"],
    ["Match CTA clicks", blogMatchClicks, "Match-request intent from blog-origin sessions"],
    ["Saved match requests", blogLeadSubmits, "Server-recorded lead submissions tied to blog attribution"],
    ["Qualified leads", blogQualified, "Blog-attributed leads claimed by a client account or qualified through the legacy admin flow"]
  ] as const;

  const trainingCount = (eventName: string) => trainingEvents.filter((event) => event.event_name === eventName).length;
  const trainingParticipantCount = (eventName: string) => {
    const matching = trainingEvents.filter((event) => event.event_name === eventName);
    const identities = matching
      .map((event) => event.user_id ? `user:${event.user_id}` : event.session_id ? `session:${event.session_id}` : null)
      .filter((value): value is string => Boolean(value));
    return identities.length ? new Set(identities).size : matching.length;
  };

  const trainingConversionStages = [
    ["Landing views", trainingParticipantCount("training_landing_view")],
    ["Signup clicks", trainingParticipantCount("training_account_click")],
    ["Accounts created", trainingParticipantCount("training_account_created")],
    ["Course starts", trainingParticipantCount("training_course_start")],
    ["Assessment submissions", trainingParticipantCount("training_assessment_submit")],
    ["Course completions", trainingParticipantCount("training_course_complete")]
  ] as const;

  const trainingTransitions = trainingConversionStages.slice(1).map(([label, value], index) => {
    const [previousLabel, previousValue] = trainingConversionStages[index];
    const rate = previousValue > 0 ? Math.round((value / previousValue) * 100) : null;
    const dropRate = previousValue > 0 && value <= previousValue
      ? Math.round(((previousValue - value) / previousValue) * 100)
      : null;
    return { previousLabel, label, previousValue, value, rate, dropRate };
  });

  const largestTrainingDrop = trainingTransitions
    .filter((transition) => transition.dropRate !== null)
    .sort((a, b) => (b.dropRate || 0) - (a.dropRate || 0))[0] || null;

  const trainingFunnel = [
    ["Training landing views", trainingCount("training_landing_view"), "All public training landing view events"],
    ["Create-account clicks", trainingCount("training_account_click"), "Clicks into the dedicated training signup"],
    ["Training accounts created", trainingCount("training_account_created"), "Successful server-recorded free training account creations"],
    ["Course starts", trainingCount("training_course_start"), "Successful server-recorded course enrolments"],
    ["Lesson completions", trainingCount("training_lesson_complete"), "Completed lessons across all learners"],
    ["Assessment submissions", trainingCount("training_assessment_submit"), "Automatic final-check submissions"],
    ["Course completions", trainingCount("training_course_complete"), "Successful server-recorded automatic course completions"]
  ] as const;

  const trainingEnrollments = (trainingEnrollmentData || []) as TrainingEnrollmentAnalyticsRow[];
  const trainingProgress = (trainingProgressData || []) as TrainingProgressAnalyticsRow[];
  const trainingSubmissions = (trainingSubmissionData || []) as TrainingSubmissionAnalyticsRow[];
  const trainingCertificates = (trainingCertificateData || []) as TrainingCertificateAnalyticsRow[];

  const moduleCourseById = new Map(trainingModules.map((module) => [module.id, module.course_id]));
  const modulePositionById = new Map(trainingModules.map((module) => [module.id, module.position]));
  const lessonCourseById = new Map(trainingLessons.map((lesson) => [lesson.id, moduleCourseById.get(lesson.module_id) || ""]));
  const lessonsByCourse = new Map<string, TrainingLessonAnalyticsRow[]>();
  for (const lesson of trainingLessons) {
    const courseId = lessonCourseById.get(lesson.id);
    if (!courseId) continue;
    const list = lessonsByCourse.get(courseId) || [];
    list.push(lesson);
    lessonsByCourse.set(courseId, list);
  }
  for (const list of lessonsByCourse.values()) {
    list.sort((a, b) =>
      Number(modulePositionById.get(a.module_id) || 0) - Number(modulePositionById.get(b.module_id) || 0) ||
      a.position - b.position ||
      a.title.localeCompare(b.title)
    );
  }

  const enrollmentsByCourse = new Map<string, Set<string>>();
  const completedEnrollmentsByCourse = new Map<string, Set<string>>();
  for (const enrollment of trainingEnrollments) {
    const enrolled = enrollmentsByCourse.get(enrollment.course_id) || new Set<string>();
    enrolled.add(enrollment.user_id);
    enrollmentsByCourse.set(enrollment.course_id, enrolled);
    if (enrollment.completed_at) {
      const completed = completedEnrollmentsByCourse.get(enrollment.course_id) || new Set<string>();
      completed.add(enrollment.user_id);
      completedEnrollmentsByCourse.set(enrollment.course_id, completed);
    }
  }

  const progressByCourseUser = new Map<string, Map<string, Set<string>>>();
  const completionsByLesson = new Map<string, Set<string>>();
  for (const progress of trainingProgress) {
    const courseId = lessonCourseById.get(progress.lesson_id);
    if (!courseId) continue;
    const byUser = progressByCourseUser.get(courseId) || new Map<string, Set<string>>();
    const userLessons = byUser.get(progress.user_id) || new Set<string>();
    userLessons.add(progress.lesson_id);
    byUser.set(progress.user_id, userLessons);
    progressByCourseUser.set(courseId, byUser);
    const lessonUsers = completionsByLesson.get(progress.lesson_id) || new Set<string>();
    lessonUsers.add(progress.user_id);
    completionsByLesson.set(progress.lesson_id, lessonUsers);
  }

  const assessmentsByCourse = new Map<string, TrainingAssessmentAnalyticsRow[]>();
  const assessmentById = new Map(trainingAssessments.map((assessment) => [assessment.id, assessment]));
  for (const assessment of trainingAssessments) {
    const list = assessmentsByCourse.get(assessment.course_id) || [];
    list.push(assessment);
    assessmentsByCourse.set(assessment.course_id, list);
  }

  const attemptedUsersByCourse = new Map<string, Set<string>>();
  const passedAssessmentIdsByCourseUser = new Map<string, Map<string, Set<string>>>();
  for (const submission of trainingSubmissions) {
    const assessment = assessmentById.get(submission.assessment_id);
    if (!assessment) continue;
    const attempted = attemptedUsersByCourse.get(assessment.course_id) || new Set<string>();
    attempted.add(submission.user_id);
    attemptedUsersByCourse.set(assessment.course_id, attempted);
    const passed =
      submission.status === "reviewed" &&
      (assessment.pass_score === null ||
        (submission.score !== null && Number(submission.score) >= Number(assessment.pass_score)));
    if (!passed) continue;
    const byUser = passedAssessmentIdsByCourseUser.get(assessment.course_id) || new Map<string, Set<string>>();
    const passedIds = byUser.get(submission.user_id) || new Set<string>();
    passedIds.add(assessment.id);
    byUser.set(submission.user_id, passedIds);
    passedAssessmentIdsByCourseUser.set(assessment.course_id, byUser);
  }

  const certifiedUsersByCourse = new Map<string, Set<string>>();
  for (const certificate of trainingCertificates) {
    if (certificate.revoked_at) continue;
    const users = certifiedUsersByCourse.get(certificate.course_id) || new Set<string>();
    users.add(certificate.user_id);
    certifiedUsersByCourse.set(certificate.course_id, users);
  }

  const trainingCourseFunnels = trainingCourses.map((course) => {
    const courseLessons = lessonsByCourse.get(course.id) || [];
    const requiredAssessments = assessmentsByCourse.get(course.id) || [];
    const progressByUser = progressByCourseUser.get(course.id) || new Map<string, Set<string>>();
    const allLessonsUsers = new Set<string>();
    for (const [userId, completedLessons] of progressByUser) {
      if (courseLessons.length && completedLessons.size >= courseLessons.length) allLessonsUsers.add(userId);
    }
    const passedUsers = new Set<string>();
    const passedByUser = passedAssessmentIdsByCourseUser.get(course.id) || new Map<string, Set<string>>();
    for (const [userId, passedIds] of passedByUser) {
      if (requiredAssessments.length && requiredAssessments.every((assessment) => passedIds.has(assessment.id))) {
        passedUsers.add(userId);
      }
    }
    const stages = [
      { label: "Enrolled", value: enrollmentsByCourse.get(course.id)?.size || 0 },
      { label: "≥1 lesson", value: progressByUser.size },
      { label: "All lessons", value: allLessonsUsers.size },
      { label: "Final attempted", value: attemptedUsersByCourse.get(course.id)?.size || 0 },
      { label: "Final passed", value: passedUsers.size },
      { label: "Completed", value: completedEnrollmentsByCourse.get(course.id)?.size || 0 },
      { label: "Certified", value: certifiedUsersByCourse.get(course.id)?.size || 0 },
    ];
    const transitions = stages.slice(1).map((stage, index) => {
      const previous = stages[index];
      const dropRate = previous.value > 0 && stage.value <= previous.value
        ? Math.round(((previous.value - stage.value) / previous.value) * 100)
        : null;
      return { from: previous.label, to: stage.label, previous: previous.value, current: stage.value, dropRate };
    });
    const biggestDrop = transitions
      .filter((transition) => transition.dropRate !== null)
      .sort((a, b) => (b.dropRate || 0) - (a.dropRate || 0))[0] || null;
    return { ...course, lessonCount: courseLessons.length, stages, biggestDrop };
  }).filter((course) => course.stages[0].value > 0 || course.stages[1].value > 0);

  const mostActiveCourse = [...trainingCourseFunnels]
    .sort((a, b) => b.stages[0].value - a.stages[0].value || a.recommended_order - b.recommended_order)[0] || null;
  const mostActiveLessons = mostActiveCourse
    ? (lessonsByCourse.get(mostActiveCourse.id) || []).map((lesson, index, orderedLessons) => {
        const completed = completionsByLesson.get(lesson.id)?.size || 0;
        const previous = index === 0
          ? mostActiveCourse.stages[0].value
          : completionsByLesson.get(orderedLessons[index - 1].id)?.size || 0;
        const dropRate = previous > 0 && completed <= previous
          ? Math.round(((previous - completed) / previous) * 100)
          : null;
        return {
          id: lesson.id,
          title: lesson.title,
          completed,
          completionRate: mostActiveCourse.stages[0].value
            ? Math.round((completed / mostActiveCourse.stages[0].value) * 100)
            : 0,
          dropRate,
        };
      })
    : [];

  const totalTrainingEnrollments = trainingCourseFunnels.reduce((sum, course) => sum + course.stages[0].value, 0);
  const totalTrainingCompletions = trainingCourseFunnels.reduce((sum, course) => sum + course.stages[5].value, 0);
  const totalTrainingCertificates = trainingCourseFunnels.reduce((sum, course) => sum + course.stages[6].value, 0);
  const courseWithLargestDrop = trainingCourseFunnels
    .filter((course) => course.biggestDrop?.dropRate !== null)
    .sort((a, b) => (b.biggestDrop?.dropRate || 0) - (a.biggestDrop?.dropRate || 0))[0] || null;

  return <>
    <div className="page-head"><div><h1>Conversion analytics</h1><p>First-party acquisition and content-funnel signals for the last 30 days. Server-side lead records remain the conversion source of truth.</p></div><span className="badge">Since {dateShort(since)}</span></div>

    <div className="stats">{acquisitionFunnel.map(([label, value, description]) => <div className="stat-card" key={label}><span className="small muted">{label}</span><strong>{value}</strong><span className="small muted">{description}</span></div>)}</div>

    <section className="card" style={{ marginBottom: 18 }}><div className="section-head"><div><div className="kicker">Content to revenue</div><h2>Blog to qualified-lead funnel</h2><p>Uses the same anonymous session ID from first article view through service/profile interactions, match request, and admin conversion.</p></div></div><div className="stats">{contentFunnel.map(([label, value, description]) => <div className="stat-card" key={label}><span className="small muted">{label}</span><strong>{value}</strong><span className="small muted">{description}</span></div>)}</div></section>

    <section className="card" style={{ marginBottom: 18 }}>
      <div className="section-head">
        <div>
          <div className="kicker">Learning funnel</div>
          <h2>Training engagement</h2>
          <p>Conversion stages use unique first-party user or session identifiers where available. Lesson completions remain an activity count because one learner can complete many lessons.</p>
        </div>
      </div>

      <div className="stats">
        {trainingConversionStages.map(([label, value], index) => {
          const transition = index > 0 ? trainingTransitions[index - 1] : null;
          return <div className="stat-card" key={label}>
            <span className="small muted">{label}</span>
            <strong>{value}</strong>
            <span className="small muted">
              {transition?.rate === null || transition === null ? "Entry stage" : `${transition.rate}% of previous stage`}
            </span>
          </div>;
        })}
      </div>

      {largestTrainingDrop ? (
        <div className="review-answer" style={{ marginTop: 14 }}>
          <span className="small muted">Largest measured drop-off</span>
          <strong style={{ display: "block", marginTop: 3 }}>
            {largestTrainingDrop.previousLabel} → {largestTrainingDrop.label}: {largestTrainingDrop.dropRate}%
          </strong>
          <span className="small muted">
            {largestTrainingDrop.previousValue} at the previous stage, {largestTrainingDrop.value} at the next stage.
          </span>
        </div>
      ) : null}

      <div className="table-wrap responsive-table" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Training event</th><th>Events</th><th>What it measures</th></tr></thead>
          <tbody>
            {trainingFunnel.map(([label, value, description]) => <tr key={label}>
              <td data-label="Training event"><strong>{label}</strong></td>
              <td data-label="Events">{value}</td>
              <td data-label="What it measures"><span className="small muted">{description}</span></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </section>

    <div className="grid-2">
      <section className="card"><h3>Tracked acquisition events</h3><div className="table-wrap responsive-table"><table><thead><tr><th>Event</th><th>Count</th></tr></thead><tbody>{Object.entries(labels).map(([event, label]) => <tr key={event}><td data-label="Event"><strong>{label}</strong><div className="small muted">{event}</div></td><td data-label="Count">{counts.get(event) || 0}</td></tr>)}</tbody></table></div></section>
      <section className="card"><h3>Lead outcomes</h3><div className="stack"><div className="review-answer"><span className="small muted">Saved role briefs</span><strong className="score-big" style={{ display: "block" }}>{roleBriefCount}</strong></div><div className="review-answer"><span className="small muted">Talent-specific introduction requests</span><strong style={{ fontSize: 24, display: "block" }}>{introBriefCount}</strong></div><div className="review-answer"><span className="small muted">Private job drafts created</span><strong style={{ fontSize: 24, display: "block" }}>{convertedLeads}</strong></div><p className="small muted">Event counts measure interaction, not unique people. For experiments, compare session-based rates and keep server-side lead records as the conversion outcome.</p></div></section>
    </div>
  </>;
}
