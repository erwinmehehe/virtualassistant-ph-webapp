import "server-only";

import { getTrainingDashboard, type TrainingCourseSummary } from "@/lib/training";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-5.6-luna";

type KiroAnswer = {
  answer: string;
  actionLabel: string | null;
  actionHref: string | null;
  source: "ai" | "fallback";
};

function cleanText(value: unknown, max = 1200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function nextHref(course: TrainingCourseSummary) {
  if (course.nextLesson) return `/workspace/training/courses/${course.slug}/lessons/${course.nextLesson.id}`;
  if (course.nextAssessment) return `/workspace/training/courses/${course.slug}/assessments/${course.nextAssessment.id}`;
  return `/workspace/training/courses/${course.slug}`;
}

function nextLabel(course: TrainingCourseSummary) {
  if (course.nextAssessment) return "Start final check";
  if (course.nextLesson) return "Continue lesson";
  return course.completedAt ? "Review course" : "Open course";
}

function safeHref(value: unknown, allowed: Set<string>) {
  const href = cleanText(value, 500);
  return href && allowed.has(href) ? href : null;
}

function fallbackAnswer(question: string, courses: TrainingCourseSummary[], savedCourseIds: string[]): KiroAnswer {
  const active = courses
    .filter((course) => course.enrolled && !course.completedAt)
    .sort((a,b) => new Date(b.lastActivityAt || 0).getTime() - new Date(a.lastActivityAt || 0).getTime());
  const completed = courses.filter((course) => Boolean(course.completedAt));
  const certificates = courses.filter((course) => course.certificate && !course.certificate.revoked_at);
  const current = active[0] || null;
  const foundation = courses.find((course) => course.slug === "virtual-assistant-foundations") || null;
  const recommended = (!foundation?.completedAt ? foundation : null) ||
    courses.find((course) => !course.enrolled && !course.completedAt) ||
    null;
  const q = question.toLowerCase();

  if (/certificate|credential/.test(q)) {
    if (certificates.length) {
      const latest = certificates
        .slice()
        .sort((a,b)=>new Date(b.certificate?.issued_at || 0).getTime()-new Date(a.certificate?.issued_at || 0).getTime())[0];
      return {
        answer: `You have ${certificates.length} certificate${certificates.length === 1 ? "" : "s"}. Your latest is ${latest.title}. Certificates confirm completed VAPH training and are separate from hiring eligibility.`,
        actionLabel: latest.certificate ? "View certificate" : null,
        actionHref: latest.certificate ? `/training/certificates/${latest.certificate.credential_code}` : null,
        source: "fallback",
      };
    }
    return {
      answer: "You do not have a certificate yet. Complete every lesson and pass the course final check to earn one.",
      actionLabel: current ? nextLabel(current) : recommended ? "Start course" : null,
      actionHref: current ? nextHref(current) : recommended ? nextHref(recommended) : null,
      source: "fallback",
    };
  }

  if (/saved|bookmark/.test(q)) {
    return {
      answer: savedCourseIds.length
        ? `You currently have ${savedCourseIds.length} saved course${savedCourseIds.length === 1 ? "" : "s"}. They are stored in your VAPH training account, so they follow you across devices.`
        : "You have no saved courses yet. Use the bookmark button in My Courses to save one to your VAPH training account.",
      actionLabel: "View saved courses",
      actionHref: "/workspace/training#saved-courses",
      source: "fallback",
    };
  }

  if (/progress|complete|how.*doing/.test(q)) {
    const totalProgress = courses.length
      ? Math.round(courses.reduce((sum,course)=>sum+course.progressPercent,0)/courses.length)
      : 0;
    return {
      answer: `Your overall course progress is ${totalProgress}%. You have completed ${completed.length} of ${courses.length} published courses, with ${active.length} currently in progress.`,
      actionLabel: current ? nextLabel(current) : null,
      actionHref: current ? nextHref(current) : null,
      source: "fallback",
    };
  }

  if (current) {
    return {
      answer: `Your best next move is to continue ${current.title}. You are ${current.progressPercent}% complete${current.nextLesson ? `, and your next lesson is “${current.nextLesson.title}.”` : current.nextAssessment ? ", and the final check is ready." : "."}`,
      actionLabel: nextLabel(current),
      actionHref: nextHref(current),
      source: "fallback",
    };
  }

  if (recommended) {
    return {
      answer: `Start with ${recommended.title}. It is the clearest next step based on your current VAPH training progress.`,
      actionLabel: "Start course",
      actionHref: nextHref(recommended),
      source: "fallback",
    };
  }

  return {
    answer: "You are caught up on the current course list. Browse the library and choose the skill that is most useful for your next client or role.",
    actionLabel: "Browse courses",
    actionHref: "/workspace/training?browse=1#course-library-title",
    source: "fallback",
  };
}

export async function answerTrainingKiro(userId: string, questionInput: string): Promise<KiroAnswer> {
  const question = cleanText(questionInput, 600);
  const dashboard = await getTrainingDashboard(userId);
  if (dashboard.error) throw new Error("Could not load your training data.");

  const courses = dashboard.courses;
  const fallback = fallbackAnswer(question, courses, dashboard.savedCourseIds || []);
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey || question.length < 2) return fallback;

  const allowedHrefs = new Set<string>([
    "/workspace/training",
    "/workspace/training#saved-courses",
    "/workspace/training?browse=1#course-library-title",
  ]);

  const courseContext = courses.map((course) => {
    const href = nextHref(course);
    allowedHrefs.add(href);
    if (course.certificate?.credential_code) {
      allowedHrefs.add(`/training/certificates/${course.certificate.credential_code}`);
    }
    return {
      title: course.title,
      slug: course.slug,
      category: course.category,
      countryFocus: course.country_focus,
      enrolled: course.enrolled,
      completed: Boolean(course.completedAt),
      progressPercent: course.progressPercent,
      completedLessons: course.completedLessons,
      lessonCount: course.lessonCount,
      nextLesson: course.nextLesson?.title || null,
      finalCheckReady: Boolean(course.nextAssessment),
      certificateCode: course.certificate?.credential_code || null,
      saved: dashboard.savedCourseIds?.includes(course.id) || false,
      actionHref: href,
      actionLabel: nextLabel(course),
    };
  });

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_TRAINING_KIRO_MODEL?.trim() || DEFAULT_MODEL,
      stream: false,
      messages: [
        {
          role: "system",
          content: [
            "You are Kiro, the VAPH training coach.",
            "Answer only from the supplied learner and course data. Never invent course progress, certificates, lessons, hiring outcomes, or eligibility.",
            "Training is free and separate from hiring. Never imply that finishing training guarantees a job, improves hiring priority, or is required to be hired.",
            "Be concise, warm, and practical. Prefer the learner's current unfinished course before recommending a new one.",
            "Return valid JSON only with answer, actionLabel, and actionHref. Keep answer under 120 words.",
            "actionHref must be one of the exact hrefs provided in the course data, /workspace/training, /workspace/training#saved-courses, /workspace/training?browse=1#course-library-title, or null.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            question,
            learner: {
              primaryCategory: dashboard.learnerProfile?.primaryCategory || null,
              australiaSpecialization: dashboard.learnerPreferences?.australiaSpecialization || null,
              savedCourseCount: dashboard.savedCourseIds?.length || 0,
            },
            courses: courseContext,
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kiro_training_answer",
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              actionLabel: { type: ["string","null"] },
              actionHref: { type: ["string","null"] },
            },
            required: ["answer","actionLabel","actionHref"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return fallback;

  try {
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string,unknown>;
    const answer = cleanText(parsed.answer, 1400);
    if (!answer) return fallback;
    const actionHref = safeHref(parsed.actionHref, allowedHrefs);
    const actionLabel = actionHref ? cleanText(parsed.actionLabel, 80) || "Open" : null;
    return { answer, actionHref, actionLabel, source: "ai" };
  } catch {
    return fallback;
  }
}
