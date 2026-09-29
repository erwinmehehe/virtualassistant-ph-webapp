import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type RecruiterClientThread = {
  id: string;
  client_id: string;
  recruiter_id: string | null;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type RecruiterClientMessage = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

async function resolvedRecruiterId(clientId: string) {
  const admin = createAdminClient();
  const [{ data: job }, { data: lead }] = await Promise.all([
    admin
      .from("jobs")
      .select("recruiter_id")
      .eq("client_id", clientId)
      .not("recruiter_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("lead_intake")
      .select("owner_id")
      .eq("client_id", clientId)
      .eq("lead_type", "client_hiring")
      .not("owner_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const candidate = String(job?.recruiter_id || lead?.owner_id || "");
  if (!candidate) return null;

  const { data: recruiter } = await admin
    .from("profiles")
    .select("id")
    .eq("id", candidate)
    .eq("role", "recruiter")
    .eq("account_status", "active")
    .maybeSingle();

  return recruiter?.id || null;
}

export async function getOrCreateClientRecruiterThread(clientId: string, jobId?: string | null) {
  const admin = createAdminClient();
  const normalizedJobId = jobId || null;
  let existingQuery = admin
    .from("client_recruiter_threads")
    .select("*")
    .eq("client_id", clientId);
  existingQuery = normalizedJobId
    ? existingQuery.eq("job_id", normalizedJobId)
    : existingQuery.is("job_id", null);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing as RecruiterClientThread;

  if (normalizedJobId) {
    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("id,client_id,recruiter_id")
      .eq("id", normalizedJobId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) throw new Error("This role does not belong to the client.");
  }

  const recruiterId = normalizedJobId
    ? ((await admin.from("jobs").select("recruiter_id").eq("id", normalizedJobId).maybeSingle()).data?.recruiter_id || await resolvedRecruiterId(clientId))
    : await resolvedRecruiterId(clientId);
  const { data: created, error } = await admin
    .from("client_recruiter_threads")
    .insert({ client_id: clientId, recruiter_id: recruiterId, job_id: normalizedJobId })
    .select("*")
    .single();

  if (error?.code === "23505") {
    let racedQuery = admin
      .from("client_recruiter_threads")
      .select("*")
      .eq("client_id", clientId);
    racedQuery = normalizedJobId
      ? racedQuery.eq("job_id", normalizedJobId)
      : racedQuery.is("job_id", null);
    const { data: raced, error: racedError } = await racedQuery.single();
    if (racedError) throw racedError;
    return raced as RecruiterClientThread;
  }
  if (error) throw error;
  return created as RecruiterClientThread;
}

export async function getRecruiterClientMessages(threadId: string, limit = 100) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_recruiter_messages")
    .select("id,thread_id,sender_id,body,read_at,created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []) as RecruiterClientMessage[];
}

export async function markRecruiterClientMessagesRead(threadId: string, viewerId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("client_recruiter_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", viewerId)
    .is("read_at", null);
  if (error) throw error;
}

export async function getRecruiterChatThreads(recruiterId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("client_recruiter_threads")
    .select("*")
    .or(`recruiter_id.eq.${recruiterId},recruiter_id.is.null`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as RecruiterClientThread[];
}
