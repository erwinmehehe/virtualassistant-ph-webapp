import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-env.mjs";
loadLocalEnv();
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: leads, error } = await admin.from("lead_intake").select("id,name,email,company,service,source_page,status,job_id,client_id,created_at").order("created_at", { ascending: false });
if (error) { console.error(error); process.exit(1); }

console.log(`Total leads: ${leads.length}`);
const byStatus = {};
for (const l of leads) byStatus[l.status] = (byStatus[l.status] || 0) + 1;
console.log("By status:", byStatus);

const bySource = {};
for (const l of leads) bySource[l.source_page] = (bySource[l.source_page] || 0) + 1;
console.log("By source:", bySource);

console.log("\n=== 'new' status leads (never converted to a job, never actioned) ===");
const untouched = leads.filter(l => l.status === "new");
for (const l of untouched) {
  const ageDays = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000);
  console.log(`- ${l.name || "?"} <${l.email}> service=${l.service || "-"} source=${l.source_page} ${ageDays}d old ${l.company ? `company=${l.company}` : ""}`);
}
console.log(`Count: ${untouched.length}`);

console.log("\n=== contact-form leads specifically (no job draft ever created for these) ===");
const contactLeads = leads.filter(l => l.source_page === "contact");
for (const l of contactLeads) {
  const ageDays = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000);
  console.log(`- ${l.name} <${l.email}> status=${l.status} ${ageDays}d old`);
}
console.log(`Count: ${contactLeads.length}`);
