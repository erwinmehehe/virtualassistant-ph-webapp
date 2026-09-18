export type LeadBudgetEstimate = {
  hourlyMin: number | null;
  hourlyMax: number | null;
  hourlyMidpoint: number | null;
  hoursPerWeek: number | null;
  monthlyBudget: number | null;
};

const WEEKS_PER_MONTH = 4.33;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function parseHourlyBudget(value?: string | null) {
  const text = String(value || "").trim();
  if (!text || /not sure/i.test(text)) {
    return { min: null as number | null, max: null as number | null, midpoint: null as number | null };
  }

  const values = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!values.length) {
    return { min: null as number | null, max: null as number | null, midpoint: null as number | null };
  }

  const min = values[0];
  const max = values.length > 1 ? Math.max(min, values[1]) : null;
  const midpoint = max == null ? min : (min + max) / 2;
  return { min, max, midpoint: roundMoney(midpoint) };
}

export function estimateHoursPerWeek(value?: string | null) {
  const text = String(value || "").trim();
  if (!text || /not sure/i.test(text)) return null;

  const values = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!values.length) return null;

  if (/under/i.test(text)) return Math.max(1, Math.round(values[0] * 0.8));
  if (values.length > 1 && /\bto\b|[-–]/i.test(text)) return Math.round((values[0] + values[1]) / 2);
  if (/\+/.test(text)) return Math.round(values[0]);
  return Math.round(values[0]);
}

export function estimateLeadBudget(budget?: string | null, hours?: string | null): LeadBudgetEstimate {
  const hourly = parseHourlyBudget(budget);
  const hoursPerWeek = estimateHoursPerWeek(hours);
  const monthlyBudget = hourly.midpoint != null && hoursPerWeek != null
    ? roundMoney(hourly.midpoint * hoursPerWeek * WEEKS_PER_MONTH)
    : null;

  return {
    hourlyMin: hourly.min,
    hourlyMax: hourly.max,
    hourlyMidpoint: hourly.midpoint,
    hoursPerWeek,
    monthlyBudget
  };
}
