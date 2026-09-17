import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-5.6-luna";
const MAX_LIST_ITEMS = 16;

type LeadJobDraft = {
  summary: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  requiredTools: string[];
  missingInformation: string[];
};

type LeadJobDraftSource = {
  title: string;
  categories: string[];
  service: string | null;
  hours: string | null;
  clientMessage: string;
  company: string | null;
  timezone: string | null;
  startTiming: string | null;
};

function cleanText(value: unknown, max = 4000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanList(value: unknown, maxItems = MAX_LIST_ITEMS) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const text = cleanText(item, 220);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= maxItems) break;
  }
  return result;
}

function parseDraft(value: unknown): LeadJobDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const summary = cleanText(raw.summary, 500);
  const description = cleanText(raw.description, 5000);
  if (summary.length < 20 || description.length < 80) return null;
  return {
    summary,
    description,
    responsibilities: cleanList(raw.responsibilities),
    requiredSkills: cleanList(raw.requiredSkills),
    requiredTools: cleanList(raw.requiredTools),
    missingInformation: cleanList(raw.missingInformation, 10)
  };
}

async function generateLeadJobDraft(source: LeadJobDraftSource): Promise<{ draft: LeadJobDraft; model: string } | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey) return null;

  const model = process.env.AI_JOB_DRAFT_MODEL?.trim() || DEFAULT_MODEL;
  const sourceJson = JSON.stringify(source, null, 2);
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: [
            "You turn a client's Virtual Assistant hiring lead into a polished candidate-facing job description.",
            "Ground every factual requirement in the supplied lead data. You may clarify and professionally expand duties the client explicitly described, but you must not invent new mandatory duties, tools, years of experience, credentials, KPIs, benefits, compensation, schedules, company facts, or qualifications.",
            "A service/category is context, not permission to add every common responsibility for that profession.",
            "If a detail is unknown, omit it from the job description and put a short recruiter-facing item in missingInformation instead.",
            "Do not mention AI, the lead form, missing data, internal recruiting notes, or assumptions in candidate-facing fields.",
            "Keep the summary concise. Make the description detailed enough to explain the role without padding. Responsibilities should be concrete and action-oriented. Only list skills or tools that are explicitly named or unambiguously required by the client's stated work.",
            "Do not repeat compensation or hours unless the client explicitly provided them in the source data."
          ].join(" ")
        },
        {
          role: "user",
          content: `Create the job draft from this source-of-truth lead data:\n${sourceJson}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_job_draft",
          description: "A grounded candidate-facing job draft derived from a client lead.",
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              description: { type: "string" },
              responsibilities: { type: "array", items: { type: "string" } },
              requiredSkills: { type: "array", items: { type: "string" } },
              requiredTools: { type: "array", items: { type: "string" } },
              missingInformation: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "description", "responsibilities", "requiredSkills", "requiredTools", "missingInformation"],
            additionalProperties: false
          }
        }
      }
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) throw new Error(`AI job draft request failed with status ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI job draft returned no content");
  const draft = parseDraft(JSON.parse(content));
  return draft ? { draft, model } : null;
}

export async function enrichPendingLeadJob(jobId: string) {
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id,lead_id,status,title,company_name,categories,timezone,start_timing")
    .eq("id", jobId)
    .maybeSingle();

  if (!job?.lead_id || job.status !== "pending") return { status: "skipped" as const };

  const { data: lead } = await admin
    .from("lead_intake")
    .select("id,service,hours,message")
    .eq("id", job.lead_id)
    .maybeSingle();

  if (!lead) return { status: "skipped" as const };

  const generated = await generateLeadJobDraft({
    title: cleanText(job.title, 180),
    categories: cleanList(job.categories, 3),
    service: cleanText(lead.service, 180) || null,
    hours: cleanText(lead.hours, 120) || null,
    clientMessage: cleanText(lead.message, 6000),
    company: cleanText(job.company_name, 220) || null,
    timezone: cleanText(job.timezone, 120) || null,
    startTiming: cleanText(job.start_timing, 160) || null
  });

  if (!generated) return { status: "skipped" as const };

  const { draft, model } = generated;
  const { error } = await admin.from("jobs").update({
    summary: draft.summary,
    description: draft.description,
    responsibilities: draft.responsibilities,
    required_skills: draft.requiredSkills,
    required_tools: draft.requiredTools
  }).eq("id", job.id).eq("status", "pending").eq("lead_id", job.lead_id);
  if (error) throw error;

  try {
    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action: "ai_job_draft_generated",
      description: "Generated a grounded job-description draft from the client's lead form for recruiter review.",
      actor_id: null,
      metadata: {
        model,
        lead_id: job.lead_id,
        missing_information: draft.missingInformation
      }
    });
  } catch {
    // The generated job draft is the source of truth. Audit logging is best effort.
  }

  return { status: "generated" as const, missingInformation: draft.missingInformation };
}
