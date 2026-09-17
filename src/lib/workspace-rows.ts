/**
 * Row shapes for workspace queries, written to match the columns each page
 * selects (see supabase/migrations for the source tables). The project has no
 * generated Supabase types, so these replace ad-hoc `any` casts.
 */

export type ProfileSummaryRow = {
  id: string;
  full_name: string | null;
  account_status?: string | null;
  email?: string | null;
};

export type VettingStageRow = {
  va_id: string;
  stage: string;
};

export type BenchMembershipRow = {
  id: string;
  va_id: string;
  category: string;
  status: "active" | "paused";
  priority: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** public.recruiter_talent_health() */
export type TalentHealthRow = {
  va_id: string;
  full_name: string | null;
  health: "Placed" | "Active" | "Hot" | "Cooling" | "Stale" | string;
  last_activity_at: string | null;
  active_processes: number;
};

export type VaReadinessRow = {
  user_id: string;
  headline: string | null;
  primary_category: string | null;
  categories: string[] | null;
  weekly_hours: number | null;
  availability_status: string | null;
  availability_confirmed_at: string | null;
  work_setup_verified_at: string | null;
};

export type OpenJobRow = {
  id: string;
  title: string | null;
  status: string;
  categories: unknown;
  created_at: string;
};

export type StaffProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export type ShortlistCandidateRow = {
  id: string;
  job_id: string;
  va_id: string;
  shortlist_status: string;
  client_decision: string | null;
  client_recommendation: string | null;
  created_at: string;
};

export type CandidateInterviewRow = {
  id: string;
  job_id: string;
  va_id: string;
  status: string;
  scheduled_at: string | null;
  client_decision: string | null;
  created_at: string;
};

export type PlacementOfferRow = {
  id: string;
  job_id: string;
  va_id: string;
  status: string;
  hourly_rate: number | null;
  weekly_hours: number | null;
  created_at: string;
};

export type RecruiterActivityRow = {
  action: string;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

/** public.recruiter_va_directory (fields used by the recruiter talent table). */
export type RecruiterVaDirectoryRow = {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  primary_category: string | null;
  availability_status: string | null;
  stage: string | null;
  completion_score: number | null;
  missing_items: string[] | null;
  directory_visible: boolean | null;
  years_experience: number | null;
  hourly_rate: number | null;
  last_activity_at: string | null;
  email_verified?: boolean | null;
  account_created_at?: string | null;
  account_status?: string | null;
};

/** va_profiles work-readiness evidence. */
export type WorkSetupRow = {
  user_id: string;
  work_setup_computer: string | null;
  work_setup_os: string | null;
  work_setup_ram_gb: number | null;
  primary_internet: string | null;
  backup_internet: string | null;
  backup_power: string | null;
  headset_ready: boolean | null;
  webcam_ready: boolean | null;
  quiet_workspace: boolean | null;
  work_setup_submitted_at: string | null;
  work_setup_verified_at: string | null;
  work_setup_verification_notes: string | null;
};

export type VaProfileReminderRow = {
  va_id: string;
  last_sent_at: string | null;
  reminder_count: number | null;
};

export type JobOptionRow = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string;
  client_id: string | null;
};

/* ---------- Placements (workrooms) ---------- */

export type WorkroomRow = {
  id: string;
  job_id: string;
  client_id: string | null;
  va_id: string | null;
  application_id: string | null;
  client_success_owner_id: string | null;
  status: string | null;
  placement_stage: string | null;
  health_status: string | null;
  health_score: number | null;
  start_date: string | null;
  agreed_schedule: string | null;
  agreed_hourly_rate: number | null;
  placement_ready_at: string | null;
  created_at: string;
};

export type PlacementCheckinRow = {
  id: string;
  workroom_id: string;
  checkpoint: string;
  due_at: string;
  status: string;
  client_signal: string | null;
  va_signal: string | null;
  client_note?: string | null;
  va_note?: string | null;
};

export type JobSummaryRow = {
  id: string;
  title: string | null;
  company_name?: string | null;
  recruiter_id?: string | null;
  hours_per_week?: number | null;
  timezone?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export type AvatarProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
};

export type WorkroomTaskRow = {
  id: string;
  workroom_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
};

export type WorkroomChecklistRow = {
  id: string;
  workroom_id: string;
  owner_role: string | null;
  title: string;
  completed_at: string | null;
};

export type TimeEntryRow = {
  id: string;
  workroom_id: string;
  hours: number | string;
  status: string;
  work_date: string;
  note: string | null;
  client_note: string | null;
};

export type PlacementSupportRequestRow = {
  id: string;
  workroom_id: string;
  requester_role: string;
  request_type: string;
  priority: string;
  status: string;
  details: string | null;
  resolution: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

/* ---------- Finance ---------- */

export type PlacementFinanceProfileRow = {
  workroom_id: string;
  expected_monthly_client_revenue: number | string | null;
  expected_monthly_va_compensation: number | string | null;
  payment_cost_percent: number | string | null;
  monthly_ops_cost: number | string | null;
  other_monthly_cost: number | string | null;
  exception_status: string | null;
  reconciled_at: string | null;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  workroom_id: string | null;
  amount_total: number | string | null;
  currency: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  released_at: string | null;
};
