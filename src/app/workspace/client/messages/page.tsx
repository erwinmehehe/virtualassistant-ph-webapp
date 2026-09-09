import Link from "next/link";
import { ChevronLeft, BriefcaseBusiness, MessageSquareText, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { sendMessageAction } from "@/app/actions/messages";
import { MarkThreadRead } from "@/components/mark-thread-read";

type ClientThreadRow={id:string;application_id:string|null;va_id:string;applications:{profile_snapshot:{full_name?:string}|null;jobs:{title:string}|null}|null};

export default async function ClientMessagesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const admin=createAdminClient();
  const {data:threadRefs}=await admin.from("conversations").select("id,application_id,va_id,created_at").eq("client_id",user.id).order("created_at",{ascending:false});
  const applicationIds=(threadRefs||[]).map((t:any)=>t.application_id).filter(Boolean);
  const {data:applicationRefs}=applicationIds.length?await admin.from("applications").select("id,job_id").in("id",applicationIds):{data:[]};
  const jobIds=[...new Set((applicationRefs||[]).map((a:any)=>a.job_id))];
  const {data:accessRows}=jobIds.length?await admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds):{data:[]};
  const accessMap=new Map((accessRows||[]).map((a:any)=>[a.job_id,a.access_status]));
  const applicationJobMap=new Map((applicationRefs||[]).map((a:any)=>[a.id,a.job_id]));
  const unlockedRefs=(threadRefs||[]).filter((t:any)=>t.application_id&&candidateAccessUnlocked(accessMap.get(applicationJobMap.get(t.application_id))));
  const unlockedApplicationIds=unlockedRefs.map((t:any)=>t.application_id).filter(Boolean);
  const {data:unlockedApplications}=unlockedApplicationIds.length?await admin.from("applications").select("id,profile_snapshot,jobs(title)").in("id",unlockedApplicationIds):{data:[]};
  const applicationMap=new Map((unlockedApplications||[]).map((a:any)=>[a.id,a]));
  const rows:ClientThreadRow[]=unlockedRefs.map((t:any)=>({id:t.id,application_id:t.application_id,va_id:t.va_id,applications:applicationMap.get(t.application_id)||null}));
  const threadIds=rows.map((t)=>t.id);
  const {data:unreadRows}=threadIds.length?await supabase.from("messages").select("conversation_id").in("conversation_id",threadIds).neq("sender_id",user.id).is("read_at",null):{data:[]};
  const unread=new Map<string,number>();
  for(const row of unreadRows||[]) unread.set(row.conversation_id,(unread.get(row.conversation_id)||0)+1);
  const active=params.thread&&threadIds.includes(params.thread)?params.thread:undefined;
  let messages:any[]=[];
  if(active){const {data}=await supabase.from("messages").select("*").eq("conversation_id",active).order("created_at",{ascending:true});messages=data||[];}
  const current=rows.find((t)=>t.id===active);

  return <>
    <div className="page-head"><div><h1>Messages</h1><p>Keep each hiring conversation attached to the correct candidate and job.</p></div></div>

    {!rows.length ? <section className="workspace-empty-card" aria-labelledby="client-messages-empty-title">
      <div className="workspace-empty-icon"><MessageSquareText size={26}/></div>
      <h2 id="client-messages-empty-title">No candidate conversations yet</h2>
      <p>Candidate conversations appear here after candidate access is active for the role. Until then, applicant identity and messages remain protected even if a Virtual Assistant has already applied.</p>
      <div className="row wrap workspace-empty-actions"><Link className="btn btn-primary" href="/workspace/client/jobs"><BriefcaseBusiness size={16}/>View jobs</Link><Link className="btn" href="/workspace/client/candidates"><UsersRound size={16}/>Browse candidates</Link></div>
    </section> : <div className={`messages-layout ${active?"has-active-thread":"no-active-thread"}`}>
      <div className="thread-list"><div className="thread-list-head"><strong>Conversations</strong><span className="thread-count">{rows.length}</span></div>{rows.map((t)=><Link className={`thread-item ${t.id===active?"active":""}`} href={`/workspace/client/messages?thread=${t.id}`} key={t.id}><div className="row-between"><strong>{t.applications?.profile_snapshot?.full_name||"Virtual Assistant applicant"}</strong>{unread.get(t.id)?<span className="unread-dot" aria-label={`${unread.get(t.id)} unread messages`}>{unread.get(t.id)}</span>:null}</div><div className="small muted">{t.applications?.jobs?.title||"Job conversation"}</div></Link>)}</div>
      <div className="message-panel">{active?<><MarkThreadRead conversationId={active}/><div className="message-head"><Link className="mobile-thread-back" href="/workspace/client/messages"><ChevronLeft size={17}/> Conversations</Link><strong>{current?.applications?.profile_snapshot?.full_name||"Candidate conversation"}</strong><div className="small muted">{current?.applications?.jobs?.title}</div></div><div className="message-body">{messages.length?messages.map((m:any)=><div className={`bubble ${m.sender_id===user.id?"mine":""}`} key={m.id}>{m.body}{m.attachment_path?<div className="message-attachment"><a href={`/api/message-attachment/${m.id}`} target="_blank" rel="noreferrer">Open attachment: {m.attachment_name||"file"}</a></div>:null}<div className="small muted" style={{marginTop:4}}>{new Date(m.created_at).toLocaleString()}</div></div>):<div className="empty">No messages yet. Start the conversation below.</div>}</div><form action={sendMessageAction} className="message-form" encType="multipart/form-data"><input type="hidden" name="conversation_id" value={active}/><label className="sr-only" htmlFor="client-message">Write a message</label><input id="client-message" name="body" placeholder="Write a message..." autoComplete="off" maxLength={5000}/><label className="btn btn-sm message-attach-button">Attach<input className="sr-only" type="file" name="attachment" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"/></label><button className="btn btn-primary" type="submit">Send</button></form></>:<div className="message-placeholder-card"><MessageSquareText size={26}/><h2>Select a conversation</h2><p>Choose a candidate thread from the left to read the history and reply.</p></div>}</div>
    </div>}
  </>;
}
