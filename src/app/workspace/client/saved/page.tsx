import Link from "next/link";
import { Heart } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { toggleSavedVaAction } from "@/app/actions/saved-vas";
import { PublicAvatar } from "@/components/public-avatar";
import { mergeUniqueStrings } from "@/lib/collections";

export default async function SavedVasPage(){
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:saved}=await supabase.from("saved_vas").select("va_id,created_at").eq("client_id",user.id).order("created_at",{ascending:false});
  const ids=(saved||[]).map((x:any)=>x.va_id);
  const admin=createAdminClient();
  const [{data:profiles},{data:vas},{data:vetting}]=ids.length?await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),
    admin.from("va_profiles").select("user_id,slug,headline,primary_category,categories,years_experience,weekly_hours,hourly_rate,availability_status,directory_visible").in("user_id",ids),
    admin.from("va_vetting").select("va_id,stage").in("va_id",ids)
  ]):[{data:[]},{data:[]},{data:[]}];
  const pm=new Map((profiles||[]).map((x:any)=>[x.id,x]));
  const vm=new Map((vas||[]).map((x:any)=>[x.user_id,x]));
  const vet=new Map((vetting||[]).map((x:any)=>[x.va_id,x.stage]));
  return <><div className="page-head"><div><h1>Saved Virtual Assistants</h1><p>Keep a private shortlist while you compare talent. Saving a public profile does not unlock private contact details.</p></div><Link className="btn btn-primary" href="/find-talent">Browse Virtual Assistants</Link></div>
  {ids.length?<div className="grid-3">{ids.map((id:string)=>{const p=pm.get(id) as any;const va=vm.get(id) as any;if(!p||!va)return null;const publicReady=va.directory_visible&&va.slug&&["approved","bench"].includes(String(vet.get(id)||""));return <article className="card" key={id}><div className="row" style={{alignItems:"center"}}><PublicAvatar name={p.full_name||"Virtual Assistant"} src={p.avatar_url}/><div><strong>{p.full_name||"Virtual Assistant"}</strong><div className="small muted">{va.headline||va.primary_category||"Virtual Assistant"}</div></div></div><div className="pill-list" style={{margin:"14px 0"}}>{mergeUniqueStrings(va.primary_category,va.categories).slice(0,3).map((x,index)=><span className="badge" key={`${x}-${index}`}>{x}</span>)}</div><div className="small muted" style={{marginBottom:12}}>{va.years_experience!=null?`${va.years_experience} yrs experience · `:""}{va.weekly_hours?`${va.weekly_hours} hrs/week · `:""}{va.hourly_rate?`$${Number(va.hourly_rate).toFixed(0)}/hr`:"Rate not set"}</div><div className="row wrap">{publicReady?<Link className="btn btn-sm btn-primary" href={`/va/${va.slug}`}>View profile</Link>:<span className="badge">Currently unavailable</span>}<form action={toggleSavedVaAction}><input type="hidden" name="va_id" value={id}/><input type="hidden" name="return_to" value="/workspace/client/saved"/><button className="btn btn-sm" type="submit"><Heart size={14}/> Remove</button></form></div></article>})}</div>:<div className="card empty"><h3>No saved VAs yet.</h3><p>Browse approved profiles and save the strongest fits here.</p><Link className="btn btn-primary" href="/find-talent">Browse Virtual Assistants</Link></div>}</>;
}
