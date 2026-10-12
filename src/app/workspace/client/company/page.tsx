import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateClientProfileAction } from "@/app/actions/profile";
import { updatePublicCompanyVisibilityAction } from "@/app/actions/company-visibility";

export default async function ClientCompanyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId,profile}=await requireRoleFast("client");
  const supabase=await createClient();
  const {data:company}=await supabase.from("client_profiles").select("*").eq("user_id",userId).single();
  return <div className="client-company-page">
    {params.visibility==="public"?<div className="success-banner">Your optional public company details are now enabled. Your company name appears on every public job listing.</div>:null}
    {params.visibility==="private"?<div className="success-banner">Optional public company details are hidden. Your company name still appears on publicly listed jobs.</div>:null}
    <div className="page-head client-company-head"><div><h1>Company profile</h1><p>Keep the details recruiters need. Public job listings display your company name; you can choose whether additional company details also appear.</p></div></div>
    <div className="stack client-company-stack" style={{maxWidth:900}}>
      <form action={updateClientProfileAction} className="card form-grid client-company-form"><div className="field"><label>Your name</label><input name="full_name" defaultValue={profile.full_name||""}/></div><div className="field"><label>Company name</label><input name="company_name" defaultValue={company?.company_name||""}/></div><div className="field"><label>Website</label><input type="url" name="website" defaultValue={company?.website||""}/></div><div className="field"><label>Company logo URL</label><input type="url" name="logo_url" defaultValue={company?.logo_url||""} placeholder="https://.../logo.png"/><span className="small muted">Use a publicly accessible HTTPS image URL.</span></div><div className="field"><label>Industry</label><input name="industry" defaultValue={company?.industry||""}/></div><div className="field"><label>Timezone</label><input name="timezone" defaultValue={company?.timezone||""} placeholder="US / Canada, Pacific"/></div><div className="field"><label>Team size</label><select name="team_size" defaultValue={company?.team_size||""}><option value="">Select</option><option>1 to 5</option><option>6 to 20</option><option>21 to 50</option><option>51 to 200</option><option>200+</option></select></div><div className="field"><label>Location</label><input name="location" defaultValue={company?.location||""} placeholder="Sydney, Australia"/></div><div className="field span-2"><label>Company description</label><textarea name="company_description" defaultValue={company?.company_description||""} placeholder="What does your company do, who do you serve, and how does the team work?"/></div><div className="field span-2"><label>Current hiring needs</label><textarea name="hiring_needs" defaultValue={company?.hiring_needs||""} placeholder="What work do you want a VA to own?"/></div><div className="field span-2"><label>Hiring notes</label><textarea name="hiring_notes" defaultValue={company?.hiring_notes||""} placeholder="What should candidates know about your team, management style, and hiring plans?"/></div><div className="span-2"><button className="btn btn-primary" type="submit">Save company profile</button></div></form>

      <form action={updatePublicCompanyVisibilityAction} className="card stack client-company-visibility">
        <div><h2 style={{marginTop:0}}>Additional public company details</h2><p className="muted">All public jobs display the hiring company name. This setting controls whether job listings also show your company logo, website, industry, location, description and verification details. For private hiring, ask the recruiting team before publishing a job.</p></div>
        <label className="visibility-toggle client-company-visibility-toggle"><input type="checkbox" name="public_company_visible" defaultChecked={Boolean(company?.public_company_visible)}/><span><strong>Show additional company details on public job listings</strong><small>When enabled, public job pages may show your company name, logo, website, industry, location, description, and verified hiring signals. Private contact details are never included.</small></span></label>
        <div className="row-between wrap client-company-visibility-actions"><span className="small muted">Off hides optional company details only. Your company name is still shown on any published job.</span><button className="btn btn-primary" type="submit">Save public identity preference</button></div>
      </form>
    </div>
  </div>;
}
