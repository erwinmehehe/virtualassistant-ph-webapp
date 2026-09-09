export const FOLLOW_UP_VIEWS = [["due", "Due today or earlier"], ["today", "Due today"], ["overdue", "Overdue"], ["unscheduled", "No follow-up scheduled"]] as const;
export type FollowUpView = typeof FOLLOW_UP_VIEWS[number][0];
export function followUpView(value?: string): FollowUpView | "" {
  return FOLLOW_UP_VIEWS.some(([key]) => key === value) ? value as FollowUpView : "";
}
export function philippineDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {timeZone:"Asia/Manila", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(now);
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function leadQueueHref(stage = "", follow = "", page = 1) {
  const params = new URLSearchParams();
  if(stage) params.set("stage", stage);
  if(followUpView(follow)) params.set("follow", follow);
  if(page > 1) params.set("page", String(page));
  return `/workspace/admin/leads${params.size ? `?${params}` : ""}`;
}
export function followUpLabel(date: string | null, stage: string, today: string) {
  if(stage === "won" || stage === "lost") return "";
  if(!date) return "No follow-up scheduled";
  if(date < today) return `Overdue · ${date}`;
  if(date === today) return "Due today";
  return `Next follow-up · ${date}`;
}
