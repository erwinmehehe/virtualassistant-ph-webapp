import "server-only";

const AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-5.6-luna";
const MAX_RECOMMENDATION_LENGTH = 500;

type RecommendationSource = {
  role: {
    title: string;
    summary: string | null;
    responsibilities: string[];
    requiredSkills: string[];
    requiredTools: string[];
    hoursPerWeek: number | null;
    timezone: string | null;
    overlapHours: number | null;
  };
  va: {
    headline: string | null;
    primaryCategory: string | null;
    categories: string[];
    skills: string[];
    tools: string[];
    availabilityStatus: string | null;
    weeklyHours: number | null;
    overlapHours: number | null;
    preferredTimezone: string | null;
  };
  verifiedEvidence: string[];
};

function cleanText(value: unknown, max = MAX_RECOMMENDATION_LENGTH) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanList(value: unknown, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const text = cleanText(item, 180);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
    if (result.length >= maxItems) break;
  }
  return result;
}

function parseRecommendation(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const recommendation = cleanText((value as Record<string, unknown>).recommendation);
  if (recommendation.length < 20) return null;
  return recommendation;
}

export async function generateClientRecommendation(source: RecommendationSource): Promise<{ recommendation: string; model: string } | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim();
  if (!apiKey) return null;

  const model = process.env.AI_CLIENT_RECOMMENDATION_MODEL?.trim() || DEFAULT_MODEL;
  const safeSource: RecommendationSource = {
    role: {
      title: cleanText(source.role.title, 180),
      summary: cleanText(source.role.summary, 800) || null,
      responsibilities: cleanList(source.role.responsibilities),
      requiredSkills: cleanList(source.role.requiredSkills),
      requiredTools: cleanList(source.role.requiredTools),
      hoursPerWeek: Number.isFinite(Number(source.role.hoursPerWeek)) ? Number(source.role.hoursPerWeek) : null,
      timezone: cleanText(source.role.timezone, 120) || null,
      overlapHours: Number.isFinite(Number(source.role.overlapHours)) ? Number(source.role.overlapHours) : null
    },
    va: {
      headline: cleanText(source.va.headline, 220) || null,
      primaryCategory: cleanText(source.va.primaryCategory, 160) || null,
      categories: cleanList(source.va.categories),
      skills: cleanList(source.va.skills),
      tools: cleanList(source.va.tools),
      availabilityStatus: cleanText(source.va.availabilityStatus, 80) || null,
      weeklyHours: Number.isFinite(Number(source.va.weeklyHours)) ? Number(source.va.weeklyHours) : null,
      overlapHours: Number.isFinite(Number(source.va.overlapHours)) ? Number(source.va.overlapHours) : null,
      preferredTimezone: cleanText(source.va.preferredTimezone, 120) || null
    },
    verifiedEvidence: cleanList(source.verifiedEvidence, 10)
  };

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
            "Write a concise client-facing recommendation explaining why a vetted Virtual Assistant fits a specific client role.",
            "Ground every claim in the supplied role and VA evidence.",
            "Do not invent experience, tools, industries, results, credentials, availability, schedules, personality traits, communication ability, or other facts that are not explicitly supplied.",
            "Use the verifiedEvidence list as the strongest source of fit claims and only add supporting facts that are directly present in the structured role or VA data.",
            "Do not mention AI, internal match scores, confidence percentages, recruiter-only screening, hard-failure logic, other client processes, or uncertainty labels.",
            "Write 2 to 3 natural sentences in a professional recruiter voice. Prefer specific overlap such as skills, tools, relevant specialty, availability, hours, or required schedule coverage when verified.",
            `Keep the final recommendation under ${MAX_RECOMMENDATION_LENGTH} characters.`
          ].join(" ")
        },
        {
          role: "user",
          content: `Create the client recommendation from this source-of-truth evidence:\n${JSON.stringify(safeSource, null, 2)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "client_recommendation",
          description: "A grounded client-facing recommendation for one VA candidate.",
          schema: {
            type: "object",
            properties: {
              recommendation: { type: "string", maxLength: MAX_RECOMMENDATION_LENGTH }
            },
            required: ["recommendation"],
            additionalProperties: false
          }
        }
      }
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) throw new Error(`AI client recommendation request failed with status ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI client recommendation returned no content");
  const recommendation = parseRecommendation(JSON.parse(content));
  return recommendation ? { recommendation, model } : null;
}
