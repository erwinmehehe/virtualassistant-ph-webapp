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
