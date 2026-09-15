import "server-only";

type CopilotTask =
  | "role_summary"
  | "compare_candidates"
  | "interview_questions"
  | "risk_check"
  | "client_recommendation"
  | "candidate_summary";

type CopilotContext = {
  task: CopilotTask;
  job?: Record<string, unknown> | null;
  candidates?: Array<Record<string, unknown>>;
};

const TASK_INSTRUCTIONS: Record<CopilotTask, string> = {
  role_summary: "Summarize the hiring brief for a recruiter. Separate must-haves, nice-to-haves, working-hours constraints, budget/rate signals, and missing information. End with 3 concrete recruiter actions.",
  compare_candidates: "Compare the supplied candidates against the role using only supplied evidence. Use a compact recruiter-facing comparison. Call out strengths, evidence gaps, capacity conflicts, and interview areas. Do not choose a winner or make the hiring decision.",
  interview_questions: "Create 8 concise, role-specific recruiter interview questions. Prioritize evidence gaps, practical skill validation, communication, schedule/overlap, reliability, and realistic job scenarios. Do not ask about protected or sensitive personal traits.",
  risk_check: "Audit the role and candidates for recruiting risks: missing hard requirements, schedule mismatch, hours/capacity conflict, rate mismatch, weak evidence, contradictory information, or stale/unknown data. Rank operational risks as high, medium, or low. Do not infer facts that are not supplied.",
  client_recommendation: "Draft a client-facing 'Why we recommend this VA' note in 2 to 4 sentences. Be specific and evidence-based. Mention relevant specialty, skills/tools, experience, schedule/hours, and availability only when supported. Never mention internal match percentages, confidence scores, AI, screening formulas, or protected personal traits. Do not claim the client should hire the person.",
  candidate_summary: "Summarize the candidate for an internal recruiter in a concise screening brief: strongest evidence, role relevance, schedule/rate, scorecard evidence, concerns, and what still needs verification. Do not make the final hiring decision."
};

const SYSTEM_INSTRUCTIONS = `You are an AI Recruiter Copilot for VirtualAssistant.com.ph. You assist professional human recruiters but never replace recruiter judgment.

Rules:
- Use only the structured evidence supplied in the request. Never invent employment history, skills, education, performance, availability, identity, or client feedback.
- Never infer or use protected or sensitive traits such as race, ethnicity, religion, disability, health, pregnancy, sex life, sexual orientation, political views, union membership, or other similarly sensitive personal characteristics.
- Do not make autonomous hiring, rejection, compensation, or employment decisions. The human recruiter must review every output before it affects a candidate or client.
- Do not rank candidates using names, photos, age, gender, nationality, family status, or other irrelevant personal attributes.
- If evidence is missing or ambiguous, say so explicitly.
- Keep language professional, concise, and suitable for an experienced recruiter.
- Internal numeric match scores may be used only as one screening signal. Never expose those numbers in client-facing recommendation copy.`;

function extractOutputText(payload: any) {
  const direct = typeof payload?.output_text === "string" ? payload.output_text.trim() : "";
  if (direct) return direct;
  const chunks: string[] = [];
  for (const item of payload?.output || []) {
    for (const part of item?.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n").trim();
}

export async function runRecruiterCopilot(context: CopilotContext) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return { ok: false as const, error: "AI Recruiter Copilot is not configured yet. Add OPENAI_API_KEY to the server environment." };

  const model = process.env.OPENAI_RECRUITER_MODEL?.trim() || "gpt-5.6-luna";
  const taskInstruction = TASK_INSTRUCTIONS[context.task];
  const evidence = JSON.stringify({ job: context.job || null, candidates: context.candidates || [] }, null, 2).slice(0, 48_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions: SYSTEM_INSTRUCTIONS,
        input: `${taskInstruction}\n\nRecruiting evidence:\n${evidence}`,
        max_output_tokens: context.task === "client_recommendation" ? 300 : 900
      }),
      signal: AbortSignal.timeout(30_000)
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("[recruiter-copilot] OpenAI request failed", response.status, payload?.error?.message || "Unknown error");
      return { ok: false as const, error: "The AI Recruiter Copilot could not generate a response right now." };
    }

    const text = extractOutputText(payload);
    if (!text) return { ok: false as const, error: "The AI Recruiter Copilot returned an empty response." };
    return { ok: true as const, text, model };
  } catch (error) {
    console.error("[recruiter-copilot] request error", error);
    return { ok: false as const, error: "The AI Recruiter Copilot could not generate a response right now." };
  }
}

export type { CopilotTask };
