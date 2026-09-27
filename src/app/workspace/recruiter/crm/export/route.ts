import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function csvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replaceAll('"','""')}"`;
}

export async function GET() {
  await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const [{data:leads,error},{data:owners,error:ownerError}] = await Promise.all([
    admin.from("lead_intake")
      .select("id,name,email,phone,company,service,hours,budget,timezone,crm_stage,owner_id,next_follow_up_at,estimated_value_usd,job_id,created_at")
      .eq("lead_type","client_hiring")
      .order("created_at",{ascending:false})
      .limit(5000),
    admin.from("profiles").select("id,full_name").in("role",["recruiter","admin"]),
  ]);
  if(error) throw error;
  if(ownerError) throw ownerError;

  const ownerMap=new Map((owners||[]).map(owner=>[owner.id,owner.full_name||""]));
  const header=["id","name","email","phone","company","service","hours","budget","timezone","crm_stage","owner","next_follow_up_at","estimated_value_usd","job_id","created_at"];
  const lines=[header.map(csvCell).join(",")];
  for(const lead of leads||[]) {
    lines.push([
      lead.id,
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.service,
      lead.hours,
      lead.budget,
      lead.timezone,
      lead.crm_stage,
      lead.owner_id ? ownerMap.get(lead.owner_id)||"" : "",
      lead.next_follow_up_at,
      lead.estimated_value_usd,
      lead.job_id,
      lead.created_at,
    ].map(csvCell).join(","));
  }

  const stamp=new Date().toISOString().slice(0,10);
  return new Response(lines.join("\r\n"),{
    status:200,
    headers:{
      "content-type":"text/csv; charset=utf-8",
      "content-disposition":`attachment; filename="vaph-crm-${stamp}.csv"`,
      "cache-control":"private, no-store",
    },
  });
}
