import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { TrainingCredentials } from "@/components/training-credentials";

export default async function VaPreviewPage(){
  const {user,profile}=await requireRole("va");
  const supabase=await createClient();
  const [{data:va},trainingCredentials]=await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id",user.id).single(),
    getTrainingCredentialsForUser(user.id),
  ]);
  const categories=mergeUniqueStrings(va?.primary_category,va?.categories);
  const skills=uniqueStrings(va?.skills);
  const tools=uniqueStrings(va?.tools);

  return <div style={{maxWidth:900,margin:"0 auto"}}>
    <div className="card" style={{padding:30}}>
      <div className="resume-hero">
        <div className="avatar">{String(profile.full_name||"VA").split(" ").map((x)=>x[0]).slice(0,2).join("")}</div>
        <div>
          <div className="kicker">Private preview</div>
          <h1 style={{margin:"3px 0 4px",fontSize:36}}>{profile.full_name}</h1>
          <p className="muted" style={{margin:0}}>{va?.headline||va?.primary_category||"Virtual Assistant"}</p>
        </div>
      </div>
      <div className="pill-list" style={{margin:"22px 0"}}>{categories.map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
      <h2>Professional summary</h2>
      <p className="muted">{va?.bio||"Add a professional summary to improve your profile."}</p>
      <TrainingCredentials credentials={trainingCredentials} heading="Training completed"/>
      <div className="grid-2" style={{marginTop:20}}>
        <section>
          <h2>Skills</h2>
          <div className="pill-list">{skills.map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
          <h2>Tools</h2>
          <div className="pill-list">{tools.map((x,index)=><span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
        </section>
        <aside className="card">
          <div className="stack">
            <div><div className="small muted">Experience</div><strong>{va?.years_experience!=null?`${va.years_experience}+ years`:"Not set"}</strong></div>
            <div><div className="small muted">Availability</div><strong>{va?.weekly_hours?`${va.weekly_hours} hours/week`:"Not set"}</strong></div>
            <div><div className="small muted">Schedule</div><strong>{va?.schedule||"Flexible"}</strong></div>
          </div>
        </aside>
      </div>
    </div>
  </div>;
}
