import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: jobs } = await admin.from("jobs").select("id,title,client_id,lead_id,status,created_at").is("client_id", null).not("lead_id", "is", null);
console.log(`${jobs.length} jobs are drafts from a lead with no client account linked.`);

const leadIds = jobs.map(j => j.lead_id);
const { data: leads } = await admin.from("lead_intake").select("id,name,email,company,created_at").in("id", leadIds);
const leadMap = new Map(leads.map(l => [l.id, l]));

for (const j of jobs) {
  const l = leadMap.get(j.lead_id);
  const ageDays = Math.floor((Date.now() - new Date(j.created_at).getTime()) / 86400000);
  console.log(`- "${j.title}" status=${j.status} lead=${l?.name || "?"} <${l?.email || "no email"}> ${ageDays}d old`);
}
