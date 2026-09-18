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
};

export type LeadScore = {
  score: number;
  temperature: LeadTemperature;
  reasons: string[];
  daysSinceTouch: number;
  daysOverdue: number;
};

const STAGE_POINTS: Record<string, number> = {
  new: 18,
  contacted: 32,
  discovery_booked: 52,
  qualified: 68,
  terms_sent: 80,
  shortlist_sent: 80,
  nurture: 30,
  won: 100,
  lost: 0
};

function timestamp(value?: string | null) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreLead(lead: LeadScoringInput, nowMs = Date.now()): LeadScore {
  const stage = String(lead.crm_stage || "new");
  if (stage === "won") return { score: 100, temperature: "hot", reasons: ["Won"], daysSinceTouch: 0, daysOverdue: 0 };
  if (stage === "lost") return { score: 0, temperature: "cold", reasons: ["Closed lost"], daysSinceTouch: 0, daysOverdue: 0 };

  let score = STAGE_POINTS[stage] ?? 18;
  const reasons: string[] = [];

  const lastTouch = Math.max(
    timestamp(lead.created_at),
    timestamp(lead.stage_updated_at),
    timestamp(lead.last_contact_at),
    timestamp(lead.discovery_completed_at)
  );
  const touchAgeDays = Math.max(0, (nowMs - lastTouch) / 86400000);
  const daysSinceTouch = Math.floor(touchAgeDays);

  if (touchAgeDays <= 1) {
    score += 15;
    reasons.push("Active today");
  } else if (touchAgeDays <= 3) {
    score += 10;
    reasons.push("Recent activity");
  } else if (touchAgeDays <= 7) {
    score += 4;
  } else if (touchAgeDays > 14) {
    score -= 12;
    reasons.push("Stale 14+ days");
  } else {
    score -= 5;
    reasons.push("Stale 7+ days");
  }

  const value = Number(lead.estimated_value_usd || 0);
  if (Number.isFinite(value) && value >= 3000) {
    score += 10;
    reasons.push("High value");
  } else if (Number.isFinite(value) && value >= 1000) {
    score += 6;
    reasons.push("Meaningful value");
  } else if (Number.isFinite(value) && value > 0) {
    score += 3;
  }

  if (lead.discovery_completed_at) {
    score += 8;
    reasons.push("Discovery completed");
  } else {
    const discoveryAt = timestamp(lead.discovery_scheduled_at);
    if (discoveryAt > nowMs) {
      score += 6;
      reasons.push("Discovery booked");
    }
  }

  const followAt = timestamp(lead.next_follow_up_at);
  let daysOverdue = 0;
  if (followAt && followAt < nowMs) {
    daysOverdue = Math.max(1, Math.ceil((nowMs - followAt) / 86400000));
    score += Math.min(12, 5 + daysOverdue);
    reasons.push(`${daysOverdue}d follow-up overdue`);
  } else if (followAt && followAt <= nowMs + 86400000) {
    score += 4;
    reasons.push("Follow-up due soon");
  }

  if (stage === "new" && !lead.first_contact_at) {
    const ageMinutes = (nowMs - timestamp(lead.created_at)) / 60000;
    if (ageMinutes > 30) {
      score += 10;
      reasons.push("First response overdue");
    }
  }

  const finalScore = clamp(score);
  const temperature: LeadTemperature = finalScore >= 70 ? "hot" : finalScore >= 40 ? "warm" : "cold";
  return { score: finalScore, temperature, reasons: reasons.slice(0, 3), daysSinceTouch, daysOverdue };
}

export function leadTemperatureLabel(value: LeadTemperature) {
  return value === "hot" ? "Hot" : value === "warm" ? "Warm" : "Cold";
}
