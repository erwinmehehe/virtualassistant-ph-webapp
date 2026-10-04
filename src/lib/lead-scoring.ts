import { estimateLeadBudget } from "@/lib/lead-economics";

export type LeadTemperature = "hot" | "warm" | "cold";

export type LeadScoringInput = {
  crm_stage?: string | null;
  created_at: string;
  stage_updated_at?: string | null;
  first_contact_at?: string | null;
  last_contact_at?: string | null;
  next_follow_up_at?: string | null;
  discovery_scheduled_at?: string | null;
  discovery_completed_at?: string | null;
  estimated_value_usd?: number | string | null;
  budget?: string | null;
  hours?: string | null;
  message?: string | null;
};

export type LeadScoringRules = {
  stagePoints: Record<string, number>;
  hotThreshold: number;
  warmThreshold: number;
  activeTodayPoints: number;
  recent3DaysPoints: number;
  recent7DaysPoints: number;
  stale7Penalty: number;
  stale14Penalty: number;
  budgetLowThreshold: number;
  budgetMediumThreshold: number;
  budgetHighThreshold: number;
  budgetAnyPoints: number;
  budgetLowPoints: number;
  budgetMediumPoints: number;
  budgetHighPoints: number;
  agencyValueMediumThreshold: number;
  agencyValueHighThreshold: number;
  agencyValueAnyPoints: number;
  agencyValueMediumPoints: number;
  agencyValueHighPoints: number;
  discoveryBookedPoints: number;
  discoveryCompletedPoints: number;
  followUpDueSoonPoints: number;
  followUpOverdueBasePoints: number;
  followUpOverdueMaxPoints: number;
  firstResponseOverdueMinutes: number;
  firstResponseOverduePoints: number;
};

export type LeadScore = {
  score: number;
  temperature: LeadTemperature;
  reasons: string[];
  daysSinceTouch: number;
  daysOverdue: number;
  estimatedMonthlyBudget: number | null;
};

export const DEFAULT_LEAD_SCORING_RULES: LeadScoringRules = {
  stagePoints: {
    new: 18,
    contacted: 32,
    discovery_booked: 52,
    qualified: 68,
    terms_sent: 80,
    shortlist_sent: 80,
    nurture: 30,
    won: 100,
    lost: 0,
  },
  hotThreshold: 70,
  warmThreshold: 40,
  activeTodayPoints: 15,
  recent3DaysPoints: 10,
  recent7DaysPoints: 4,
  stale7Penalty: 5,
  stale14Penalty: 12,
  budgetLowThreshold: 500,
  budgetMediumThreshold: 1000,
  budgetHighThreshold: 2000,
  budgetAnyPoints: 2,
  budgetLowPoints: 4,
  budgetMediumPoints: 7,
  budgetHighPoints: 10,
  agencyValueMediumThreshold: 1000,
  agencyValueHighThreshold: 3000,
  agencyValueAnyPoints: 2,
  agencyValueMediumPoints: 4,
  agencyValueHighPoints: 6,
  discoveryBookedPoints: 6,
  discoveryCompletedPoints: 8,
  followUpDueSoonPoints: 4,
  followUpOverdueBasePoints: 5,
  followUpOverdueMaxPoints: 12,
  firstResponseOverdueMinutes: 30,
  firstResponseOverduePoints: 10,
};

function finiteNumber(value: unknown, fallback: number, min = 0, max = 10000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

export function normalizeLeadScoringRules(input?: unknown): LeadScoringRules {
  const raw = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const rawStages = raw.stagePoints && typeof raw.stagePoints === "object" && !Array.isArray(raw.stagePoints)
    ? raw.stagePoints as Record<string, unknown>
    : {};
  const stagePoints = Object.fromEntries(
    Object.entries(DEFAULT_LEAD_SCORING_RULES.stagePoints).map(([stage, fallback]) => [
      stage,
      finiteNumber(rawStages[stage], fallback, 0, 100),
    ]),
  );
  const hotThreshold = finiteNumber(raw.hotThreshold, DEFAULT_LEAD_SCORING_RULES.hotThreshold, 1, 100);
  const warmThreshold = Math.min(
    hotThreshold,
    finiteNumber(raw.warmThreshold, DEFAULT_LEAD_SCORING_RULES.warmThreshold, 0, 99),
  );
  const budgetLowThreshold = finiteNumber(raw.budgetLowThreshold, DEFAULT_LEAD_SCORING_RULES.budgetLowThreshold, 0, 100000);
  const budgetMediumThreshold = Math.max(
    budgetLowThreshold,
    finiteNumber(raw.budgetMediumThreshold, DEFAULT_LEAD_SCORING_RULES.budgetMediumThreshold, 0, 100000),
  );
  const budgetHighThreshold = Math.max(
    budgetMediumThreshold,
    finiteNumber(raw.budgetHighThreshold, DEFAULT_LEAD_SCORING_RULES.budgetHighThreshold, 0, 100000),
  );
  const agencyValueMediumThreshold = finiteNumber(raw.agencyValueMediumThreshold, DEFAULT_LEAD_SCORING_RULES.agencyValueMediumThreshold, 0, 1000000);
  const agencyValueHighThreshold = Math.max(
    agencyValueMediumThreshold,
    finiteNumber(raw.agencyValueHighThreshold, DEFAULT_LEAD_SCORING_RULES.agencyValueHighThreshold, 0, 1000000),
  );

  return {
    stagePoints,
    hotThreshold,
    warmThreshold,
    activeTodayPoints: finiteNumber(raw.activeTodayPoints, DEFAULT_LEAD_SCORING_RULES.activeTodayPoints, 0, 50),
    recent3DaysPoints: finiteNumber(raw.recent3DaysPoints, DEFAULT_LEAD_SCORING_RULES.recent3DaysPoints, 0, 50),
    recent7DaysPoints: finiteNumber(raw.recent7DaysPoints, DEFAULT_LEAD_SCORING_RULES.recent7DaysPoints, 0, 50),
    stale7Penalty: finiteNumber(raw.stale7Penalty, DEFAULT_LEAD_SCORING_RULES.stale7Penalty, 0, 50),
    stale14Penalty: finiteNumber(raw.stale14Penalty, DEFAULT_LEAD_SCORING_RULES.stale14Penalty, 0, 50),
    budgetLowThreshold,
    budgetMediumThreshold,
    budgetHighThreshold,
    budgetAnyPoints: finiteNumber(raw.budgetAnyPoints, DEFAULT_LEAD_SCORING_RULES.budgetAnyPoints, 0, 50),
    budgetLowPoints: finiteNumber(raw.budgetLowPoints, DEFAULT_LEAD_SCORING_RULES.budgetLowPoints, 0, 50),
    budgetMediumPoints: finiteNumber(raw.budgetMediumPoints, DEFAULT_LEAD_SCORING_RULES.budgetMediumPoints, 0, 50),
    budgetHighPoints: finiteNumber(raw.budgetHighPoints, DEFAULT_LEAD_SCORING_RULES.budgetHighPoints, 0, 50),
    agencyValueMediumThreshold,
    agencyValueHighThreshold,
    agencyValueAnyPoints: finiteNumber(raw.agencyValueAnyPoints, DEFAULT_LEAD_SCORING_RULES.agencyValueAnyPoints, 0, 50),
    agencyValueMediumPoints: finiteNumber(raw.agencyValueMediumPoints, DEFAULT_LEAD_SCORING_RULES.agencyValueMediumPoints, 0, 50),
    agencyValueHighPoints: finiteNumber(raw.agencyValueHighPoints, DEFAULT_LEAD_SCORING_RULES.agencyValueHighPoints, 0, 50),
    discoveryBookedPoints: finiteNumber(raw.discoveryBookedPoints, DEFAULT_LEAD_SCORING_RULES.discoveryBookedPoints, 0, 50),
    discoveryCompletedPoints: finiteNumber(raw.discoveryCompletedPoints, DEFAULT_LEAD_SCORING_RULES.discoveryCompletedPoints, 0, 50),
    followUpDueSoonPoints: finiteNumber(raw.followUpDueSoonPoints, DEFAULT_LEAD_SCORING_RULES.followUpDueSoonPoints, 0, 50),
    followUpOverdueBasePoints: finiteNumber(raw.followUpOverdueBasePoints, DEFAULT_LEAD_SCORING_RULES.followUpOverdueBasePoints, 0, 50),
    followUpOverdueMaxPoints: finiteNumber(raw.followUpOverdueMaxPoints, DEFAULT_LEAD_SCORING_RULES.followUpOverdueMaxPoints, 0, 50),
    firstResponseOverdueMinutes: finiteNumber(raw.firstResponseOverdueMinutes, DEFAULT_LEAD_SCORING_RULES.firstResponseOverdueMinutes, 1, 1440),
    firstResponseOverduePoints: finiteNumber(raw.firstResponseOverduePoints, DEFAULT_LEAD_SCORING_RULES.firstResponseOverduePoints, 0, 50),
  };
}

function timestamp(value?: string | null) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreLead(
  lead: LeadScoringInput,
  nowMs = Date.now(),
  rulesInput?: LeadScoringRules | null,
): LeadScore {
  const rules = rulesInput || DEFAULT_LEAD_SCORING_RULES;
  const budget = estimateLeadBudget(lead.budget, lead.hours, lead.message);
  const stage = String(lead.crm_stage || "new");
  if (stage === "won") return { score: 100, temperature: "hot", reasons: ["Won"], daysSinceTouch: 0, daysOverdue: 0, estimatedMonthlyBudget: budget.monthlyBudget };
  if (stage === "lost") return { score: 0, temperature: "cold", reasons: ["Closed lost"], daysSinceTouch: 0, daysOverdue: 0, estimatedMonthlyBudget: budget.monthlyBudget };

  let score = rules.stagePoints[stage] ?? rules.stagePoints.new;
  const reasons: string[] = [];

  const lastTouch = Math.max(
    timestamp(lead.created_at),
    timestamp(lead.stage_updated_at),
    timestamp(lead.last_contact_at),
    timestamp(lead.discovery_completed_at),
  );
  const touchAgeDays = Math.max(0, (nowMs - lastTouch) / 86400000);
  const daysSinceTouch = Math.floor(touchAgeDays);

  if (touchAgeDays <= 1) {
    score += rules.activeTodayPoints;
    reasons.push("Active today");
  } else if (touchAgeDays <= 3) {
    score += rules.recent3DaysPoints;
    reasons.push("Recent activity");
  } else if (touchAgeDays <= 7) {
    score += rules.recent7DaysPoints;
  } else if (touchAgeDays > 14) {
    score -= rules.stale14Penalty;
    reasons.push("Stale 14+ days");
  } else {
    score -= rules.stale7Penalty;
    reasons.push("Stale 7+ days");
  }

  if (budget.monthlyBudget != null) {
    if (budget.monthlyBudget >= rules.budgetHighThreshold) {
      score += rules.budgetHighPoints;
      reasons.push("Strong budget + hours");
    } else if (budget.monthlyBudget >= rules.budgetMediumThreshold) {
      score += rules.budgetMediumPoints;
      reasons.push("Healthy budget + hours");
    } else if (budget.monthlyBudget >= rules.budgetLowThreshold) {
      score += rules.budgetLowPoints;
      reasons.push("Budget + hours confirmed");
    } else {
      score += rules.budgetAnyPoints;
    }
  } else {
    const agencyValue = Number(lead.estimated_value_usd || 0);
    if (Number.isFinite(agencyValue) && agencyValue >= rules.agencyValueHighThreshold) {
      score += rules.agencyValueHighPoints;
      reasons.push("High agency value");
    } else if (Number.isFinite(agencyValue) && agencyValue >= rules.agencyValueMediumThreshold) {
      score += rules.agencyValueMediumPoints;
      reasons.push("Meaningful agency value");
    } else if (Number.isFinite(agencyValue) && agencyValue > 0) {
      score += rules.agencyValueAnyPoints;
    }
  }

  if (lead.discovery_completed_at) {
    score += rules.discoveryCompletedPoints;
    reasons.push("Discovery completed");
  } else {
    const discoveryAt = timestamp(lead.discovery_scheduled_at);
    if (discoveryAt > nowMs) {
      score += rules.discoveryBookedPoints;
      reasons.push("Discovery booked");
    }
  }

  const followAt = timestamp(lead.next_follow_up_at);
  let daysOverdue = 0;
  if (followAt && followAt < nowMs) {
    daysOverdue = Math.max(1, Math.ceil((nowMs - followAt) / 86400000));
    score += Math.min(rules.followUpOverdueMaxPoints, rules.followUpOverdueBasePoints + daysOverdue);
    reasons.push(`${daysOverdue}d follow-up overdue`);
  } else if (followAt && followAt <= nowMs + 86400000) {
    score += rules.followUpDueSoonPoints;
    reasons.push("Follow-up due soon");
  }

  if (stage === "new" && !lead.first_contact_at) {
    const ageMinutes = (nowMs - timestamp(lead.created_at)) / 60000;
    if (ageMinutes > rules.firstResponseOverdueMinutes) {
      score += rules.firstResponseOverduePoints;
      reasons.push("First response overdue");
    }
  }

  const finalScore = clamp(score);
  const temperature: LeadTemperature = finalScore >= rules.hotThreshold
    ? "hot"
    : finalScore >= rules.warmThreshold
      ? "warm"
      : "cold";
  return {
    score: finalScore,
    temperature,
    reasons: reasons.slice(0, 3),
    daysSinceTouch,
    daysOverdue,
    estimatedMonthlyBudget: budget.monthlyBudget,
  };
}

export function leadTemperatureLabel(value: LeadTemperature) {
  return value === "hot" ? "Hot" : value === "warm" ? "Warm" : "Cold";
}
