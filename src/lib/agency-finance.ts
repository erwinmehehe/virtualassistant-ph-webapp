export type FinanceStatus = "needs_setup" | "healthy" | "watch" | "approval_required" | "approved_exception";

export type PlacementFinanceInput = {
  expectedMonthlyClientRevenue: number;
  expectedMonthlyVaCompensation: number;
  paymentCostPercent: number;
  monthlyOpsCost: number;
  otherMonthlyCost: number;
  minMarginPercent: number;
  targetMarginPercent: number;
  exceptionStatus?: string | null;
};

export type PlacementFinanceResult = {
  paymentCost: number;
  totalMonthlyCost: number;
  contribution: number;
  marginPercent: number;
  status: FinanceStatus;
};

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;
}

export function estimateMonthlyHours(hoursPerWeek: number | null | undefined) {
  const weekly = Math.max(0, Number(hoursPerWeek || 0));
  return roundMoney((weekly * 52) / 12);
}

export function calculatePlacementFinance(input: PlacementFinanceInput): PlacementFinanceResult {
  const revenue = Math.max(0, Number(input.expectedMonthlyClientRevenue || 0));
  const vaCompensation = Math.max(0, Number(input.expectedMonthlyVaCompensation || 0));
  const paymentCostPercent = Math.max(0, Math.min(100, Number(input.paymentCostPercent || 0)));
  const monthlyOpsCost = Math.max(0, Number(input.monthlyOpsCost || 0));
  const otherMonthlyCost = Math.max(0, Number(input.otherMonthlyCost || 0));
  const minMarginPercent = Math.max(0, Math.min(100, Number(input.minMarginPercent || 0)));
  const targetMarginPercent = Math.max(minMarginPercent, Math.min(100, Number(input.targetMarginPercent || 0)));

  const paymentCost = roundMoney(revenue * paymentCostPercent / 100);
  const totalMonthlyCost = roundMoney(vaCompensation + paymentCost + monthlyOpsCost + otherMonthlyCost);
  const contribution = roundMoney(revenue - totalMonthlyCost);
  const marginPercent = revenue > 0 ? roundPercent((contribution / revenue) * 100) : 0;

  let status: FinanceStatus = "needs_setup";
  if (revenue > 0) {
    if (marginPercent < minMarginPercent) {
      status = input.exceptionStatus === "approved" ? "approved_exception" : "approval_required";
    } else if (marginPercent < targetMarginPercent) {
      status = "watch";
    } else {
      status = "healthy";
    }
  }

  return { paymentCost, totalMonthlyCost, contribution, marginPercent, status };
}

export function financeStatusLabel(status: FinanceStatus, marginPercent?: number) {
  const margin = Number.isFinite(Number(marginPercent)) ? ` · ${Number(marginPercent).toFixed(1)}%` : "";
  if (status === "healthy") return `Healthy margin${margin}`;
  if (status === "watch") return `Below target${margin}`;
  if (status === "approval_required") return `Owner approval required${margin}`;
  if (status === "approved_exception") return `Approved exception${margin}`;
  return "Economics not set";
}
