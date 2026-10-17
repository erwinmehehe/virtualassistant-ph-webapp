import { NextResponse } from "next/server";
import { getFastRoleProfile } from "@/lib/auth";
import { enforceActionRateLimit } from "@/lib/rate-limit";
import { getTrainingLesson } from "@/lib/training";
import {
  buildTrainingCoachMessages,
  extractTrainingCoachReply,
  isTrainingCoachPilotLearner,
  parseTrainingCoachRequest,
  trainingCoachRequestsExamAnswers,
} from "@/lib/training-coach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const RESPONSE_HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: RESPONSE_HEADERS });
}


/** Offline fixture: development + loopback Supabase only. Never a live AI response. */
function allowLocalCoachFixture() {
  if (process.env.NODE_ENV !== "development" || process.env.AI_TRAINING_COACH_E2E_MOCK !== "true") return false;
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function localCoachFixtureReply(mode: "explain" | "practice" | "review", lessonTitle: string) {
  const prefix = "LOCAL TEST COACH - not a live AI response. ";
  if (mode === "practice") return prefix + "Fictional client: please draft a short confirmation email using dummy names.";
  if (mode === "review") return prefix + "Paste a fictional practice draft for " + lessonTitle + " so I can suggest one improvement.";
  return prefix + "For " + lessonTitle + ", what is the first practical step you would take?";
}

// Phase 1: closed by default, Foundations only, no schema migrations.
export async function POST(request: Request) {
  if (process.env.AI_TRAINING_COACH_ENABLED !== "true") return failure("Not found.", 404);

  const session = await getFastRoleProfile();
  if (!session.userId) return failure("Sign in to use your training coach.", 401);
  if (!isTrainingCoachPilotLearner(session.userId)) return failure("The coach is currently limited to pilot learners.", 403);

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return failure("Use a JSON request.", 415);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return failure("The request is too long.", 413);
    body = JSON.parse(raw);
  } catch {
    return failure("The request could not be read.", 400);
  }

  const input = parseTrainingCoachRequest(body);
  if (!input) return failure("Please enter a valid lesson question.", 400);

  const { course, lesson, error } = await getTrainingLesson(input.courseSlug, input.lessonId, session.userId);
  if (error) return failure("This lesson is temporarily unavailable.", 503);
  if (!course || !lesson) return failure("Lesson not found.", 404);
  if (!course.enrolled) return failure("Start this course to use the coach.", 403);
  if (!Array.isArray(lesson.content) || lesson.content.length === 0) {
    return failure("This lesson is not ready for coaching yet.", 422);
  }

  const question = input.messages[input.messages.length - 1].content;
  if (trainingCoachRequestsExamAnswers(question)) {
    return NextResponse.json({
      reply: "I cannot supply answers to graded assessments. I can explain the related lesson or give you a similar practice scenario so you can work it out yourself.",
      source: { courseTitle: course.title, lessonTitle: lesson.title },
    }, { headers: RESPONSE_HEADERS });
  }

  try {
    // Uses the existing Postgres atomic limiter: 20 messages per learner per 24 hours.
    await enforceActionRateLimit("training-ai-coach", session.userId, 20, 1440);
  } catch (cause) {
    const isLimit = cause instanceof Error && cause.message.startsWith("Too many attempts");
    return failure(
      isLimit ? "You have reached your daily coaching limit. Please try again tomorrow." : "Coach access is temporarily unavailable.",
      isLimit ? 429 : 503,
    );
  }


  // Exercise authentic session, enrollment, lesson lookup, and rate-limit gates first.
  if (allowLocalCoachFixture()) {
    return NextResponse.json({
      reply: localCoachFixtureReply(input.mode, lesson.title),
      source: { courseTitle: course.title, lessonTitle: lesson.title },
      testOnly: true,
    }, { headers: RESPONSE_HEADERS });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey) return failure("The coach is not configured yet.", 503);

  const model = process.env.AI_TRAINING_COACH_MODEL?.trim() || "openai/gpt-5.4";
  // Optional free-only gate: never silently fall back to a billable model.
  if (process.env.AI_TRAINING_COACH_FREE_ONLY === "true" && model !== "reflection/beam-free") {
    return failure("The free coaching model is not configured.", 503);
  }

  const messages = buildTrainingCoachMessages({
    request: input,
    courseTitle: course.title,
    lessonTitle: lesson.title,
    completedLessons: course.completedLessons,
    lessonCount: course.lessonCount,
    lessonContent: lesson.content,
  });

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        max_completion_tokens: 1200,
        messages,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(24000),
    });

    if (!response.ok) {
      console.error("[training-coach] Gateway request failed", { status: response.status });
      return failure("The coach is temporarily unavailable. Please try again.", 502);
    }

    const reply = extractTrainingCoachReply(await response.json());
    if (!reply) return failure("The coach could not generate a response. Please try again.", 502);

    return NextResponse.json({
      reply,
      source: { courseTitle: course.title, lessonTitle: lesson.title },
    }, { headers: RESPONSE_HEADERS });
  } catch (cause) {
    console.error("[training-coach] Gateway failure", { type: cause instanceof Error ? cause.name : "unknown" });
    return failure("The coach could not connect. Please try again.", 503);
  }
}
