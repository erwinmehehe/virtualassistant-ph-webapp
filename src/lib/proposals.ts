export function proposalMonthlyVaCost(hoursPerWeek?: number | null, rate?: number | null) {
  if (!hoursPerWeek || !rate) return 0;
  return Math.round(hoursPerWeek * rate * 4.33 * 100) / 100;
}

export function proposalClientMonthlyTotal(args: {
  hoursPerWeek?: number | null;
  vaRate?: number | null;
  serviceModel: string;
  managedMarkupPercent?: number | null;
}) {
  const vaCost = proposalMonthlyVaCost(args.hoursPerWeek, args.vaRate);
  if (args.serviceModel !== "managed_service") return vaCost;
  const markup = Math.max(0, Number(args.managedMarkupPercent || 0));
  return Math.round(vaCost * (1 + markup / 100) * 100) / 100;
}

export function proposalAgencyValue(args: {
  hoursPerWeek?: number | null;
  vaRate?: number | null;
  serviceModel: string;
  placementFee?: number | null;
  managedMarkupPercent?: number | null;
}) {
  if (args.serviceModel === "curated_placement") return Math.max(0, Number(args.placementFee || 0));
  const vaCost = proposalMonthlyVaCost(args.hoursPerWeek, args.vaRate);
  return Math.round(vaCost * Math.max(0, Number(args.managedMarkupPercent || 0)) / 100 * 100) / 100;
}

export function proposalStatusLabel(status?: string | null) {
  const labels: Record<string,string> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired"
  };
  return labels[status || ""] || "Draft";
}
