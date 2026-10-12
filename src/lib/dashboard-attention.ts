import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HomeAccess, HomeInterview, HomeOffer, HomeRole, HomeShortlist, HomeTerms, HomeWorkItem } from "@/lib/beginner-dashboard-actions";

export type ClientHomeSignals = {
  roles: HomeRole[];
  offers: HomeOffer[];
  interviews: HomeInterview[];
  shortlists: HomeShortlist[];
  terms: HomeTerms[];
  access: HomeAccess[];
  timeToReview: HomeWorkItem[];
  tasksToReview: HomeWorkItem[];
  activePlacements: number;
};

export type VaHomeSignals = { offers: HomeOffer[]; interviews: HomeInterview[] };

/** Server-only role-scoped data. Service-role reads never reach the browser. */
export async function getClientHomeSignals(clientId: string): Promise<ClientHomeSignals | null> {
  try {
    const admin = createAdminClient();
    const [jobResult, offerResult, interviewResult, roomResult] = await Promise.all([
      admin.from("jobs").select("id,title,status,moderation_status")
        .eq("client_id", clientId).in("status", ["pending", "published"]).order("created_at", { ascending: false }).limit(100),
      admin.from("placement_offers").select("id,job_id,status")
        .eq("client_id", clientId).in("status", ["pending_va", "pending_client"]).order("created_at", { ascending: false }).limit(100),
      admin.from("candidate_interviews").select("id,job_id,status,scheduled_at,duration_minutes,client_decision")
        .eq("client_id", clientId).in("status", ["requested", "scheduled"]).order("created_at", { ascending: false }).limit(100),
      admin.from("workrooms").select("id,status")
        .eq("client_id", clientId).order("created_at", { ascending: false }).limit(100),
    ]);
    if (jobResult.error || offerResult.error || interviewResult.error || roomResult.error) return null;

    const roles = (jobResult.data || []) as HomeRole[];
    const roleIds = roles.map((role) => role.id);
    const openRooms = (roomResult.data || []).filter((room) => room.status !== "completed");
    const roomIds = openRooms.map((room) => room.id);

    const [shortlistResult, termsResult, accessResult, timeResult, taskResult] = await Promise.all([
      roleIds.length
        ? admin.from("job_shortlist_candidates").select("job_id,client_decision")
          .in("job_id", roleIds).eq("shortlist_status", "released").limit(300)
        : Promise.resolve({ data: [], error: null }),
      roleIds.length
        ? admin.from("job_commercials").select("job_id,commercial_status").in("job_id", roleIds).limit(100)
        : Promise.resolve({ data: [], error: null }),
      roleIds.length
        ? admin.from("job_candidate_access").select("job_id,access_status").in("job_id", roleIds).limit(100)
        : Promise.resolve({ data: [], error: null }),
      roomIds.length
        ? admin.from("time_entries").select("workroom_id").in("workroom_id", roomIds).eq("status", "pending").limit(200)
        : Promise.resolve({ data: [], error: null }),
      roomIds.length
        ? admin.from("workroom_tasks").select("workroom_id").in("workroom_id", roomIds).eq("status", "review").limit(200)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (shortlistResult.error || termsResult.error || accessResult.error || timeResult.error || taskResult.error) return null;

    return {
      roles,
      offers: (offerResult.data || []) as HomeOffer[],
      interviews: (interviewResult.data || []) as HomeInterview[],
      shortlists: (shortlistResult.data || []) as HomeShortlist[],
      terms: (termsResult.data || []) as HomeTerms[],
      access: (accessResult.data || []) as HomeAccess[],
      timeToReview: (timeResult.data || []) as HomeWorkItem[],
      tasksToReview: (taskResult.data || []) as HomeWorkItem[],
      activePlacements: openRooms.length,
    };
  } catch {
    return null;
  }
}

export async function getVaHomeSignals(vaId: string): Promise<VaHomeSignals | null> {
  try {
    const admin = createAdminClient();
    const [offers, interviews] = await Promise.all([
      admin.from("placement_offers").select("id,job_id,status")
        .eq("va_id", vaId).in("status", ["pending_va", "pending_client"]).order("created_at", { ascending: false }).limit(100),
      admin.from("candidate_interviews").select("id,job_id,status,scheduled_at")
        .eq("va_id", vaId).eq("status", "scheduled").order("scheduled_at", { ascending: true }).limit(100),
    ]);
    if (offers.error || interviews.error) return null;
    return {
      offers: (offers.data || []) as HomeOffer[],
      interviews: (interviews.data || []) as HomeInterview[],
    };
  } catch {
    return null;
  }
}
