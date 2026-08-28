export type Role = "client" | "va" | "recruiter" | "admin";
export type ApplicationStatus = "new" | "reviewing" | "shortlisted" | "interview" | "offered" | "hired" | "rejected" | "withdrawn";
export type JobStatus = "draft" | "pending" | "published" | "closed";
export type VettingStage = "profile" | "test" | "video" | "recruiter_review" | "finalist" | "approved" | "bench" | "rejected";

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  avatar_url: string | null;
};

export type VaProfile = {
  user_id: string;
  headline: string | null;
  bio: string | null;
  primary_category: string | null;
  categories: string[];
  skills: string[];
  tools: string[];
  industries: string[];
  languages: string[];
  years_experience: number | null;
  weekly_hours: number | null;
  schedule: string | null;
  overlap_hours: number | null;
  hourly_rate: number | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  resume_path: string | null;
  directory_visible: boolean;
  availability_status: string;
  slug: string | null;
};

export type VaVetting = {
  va_id: string;
  stage: VettingStage;
  recruiter_id: string | null;
  video_url: string | null;
  video_submitted_at: string | null;
  recruiter_interview_at: string | null;
  recruiter_notes: string | null;
  admin_notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};
