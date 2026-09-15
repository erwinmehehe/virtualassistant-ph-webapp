import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateClientProfileAction } from "@/app/actions/profile";
import { updatePublicCompanyVisibilityAction } from "@/app/actions/company-visibility";

export default async function ClientCompanyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user,profile}=await requireRole("client");
  const supabase=await createClient();
  const {data:company}=await supabase.from("client_profiles").select("*").eq("user_id",user.id).single();
  return <>
    {params.visibility==="public"?<div className="success-banner">Your company can now appear by name on public job listings.</div>:null}
    {params.visibility==="private"?<div className="success-banner">Public company identity is off. Public job listings will use “Confidential Client”.</div>:null}
    <div className="page-head"><div><h1>Company profile</h1><p>Keep the information recruiters need for hiring. Public company identity is a separate choice below.</p></div></div>
    <div className="stack" style={{maxWidth:900}}>
      <form action={updateClientProfileAction} className="card form-grid"><div className="field"><label>Your name</label><input name="full_name" defaultValue={profile.full_name||""}/></div><div className="field"><label>Company name</label><input name="company_name" defaultValue={company?.company_name||""}/></div><div className="field"><label>Website</label><input type="url" name="website" defaultValue={company?.website||""}/></div><div className="field"><label>Company logo URL</label><input type="url" name="logo_url" defaultValue={company?.logo_url||""} placeholder="https://.../logo.png"/><span className="small muted">Use a publicly accessible HTTPS image URL.</span></div><div className="field"><label>Industry</label><input name="industry" defaultValue={company?.industry||""}/></div><div className="field"><label>Timezone</label><input name="timezone" defaultValue={company?.timezone||""} placeholder="US / Canada, Pacific"/></div><div className="field"><label>Team size</label><select name="team_size" defaultValue={company?.team_size||""}><option value="">Select</option><option>1 to 5</option><option>6 to 20</option><option>21 to 50</option><option>51 to 200</option><option>200+</option></select></div><div className="field"><label>Location</label><input name="location" defaultValue={company?.location||""} placeholder="Sydney, Australia"/></div><div className="field span-2"><label>Company description</label><textarea name="company_description" defaultValue={company?.company_description||""} placeholder="What does your company do, who do you serve, and how does the team work?"/></div><div className="field span-2"><label>Current hiring needs</label><textarea name="hiring_needs" defaultValue={company?.hiring_needs||""} placeholder="What work do you want a VA to own?"/></div><div className="field span-2"><label>Hiring notes</label><textarea name="hiring_notes" defaultValue={company?.hiring_notes||""} placeholder="What should candidates know about your team, management style, and hiring plans?"/></div><div className="span-2"><button className="btn btn-primary" type="submit">Save company profile</button></div></form>

      <form action={updatePublicCompanyVisibilityAction} className="card stack">
        <div><h2 style={{marginTop:0}}>Public company identity</h2><p className="muted">Your company name is private by default. Turn this on only if you want public job listings to identify your company.</p></div>
        <label className="visibility-toggle"><input type="checkbox" name="public_company_visible" defaultChecked={Boolean(company?.public_company_visible)}/><span><strong>Show my company publicly on job listings</strong><small>When enabled, public job pages may show your company name, logo, website, industry, location, description, and verified hiring signals. Private contact details are never included.</small></span></label>
        <div className="row-between wrap"><span className="small muted">Off means public roles use “Confidential Client”. Recruiters and your own workspace still keep the full company record.</span><button className="btn btn-primary" type="submit">Save public identity preference</button></div>
      </form>
    </div>
  </>;
}
