import Link from "next/link";
import { ChevronLeft, FileText, MessageSquareText, Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendMessageAction } from "@/app/actions/messages";
import { MarkThreadRead } from "@/components/mark-thread-read";

type VaThreadRow={id:string;application_id:string|null;client_id:string;applications:{jobs:{title:string;company_name?:string}|null}|null};

export default async function VaMessagesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("va");
  const supabase=await createClient();
  const {data:threads}=await supabase.from("conversations").select("id,application_id,client_id,applications(jobs(title,company_name))").eq("va_id",user.id).order("created_at",{ascending:false}) as {data:VaThreadRow[]|null};
  const rows=threads||[];
  const threadIds=rows.map((t)=>t.id);
  const {data:unreadRows}=threadIds.length?await supabase.from("messages").select("conversation_id").in("conversation_id",threadIds).neq("sender_id",user.id).is("read_at",null):{data:[]};
  const unread=new Map<string,number>();
  for(const row of unreadRows||[]) unread.set(row.conversation_id,(unread.get(row.conversation_id)||0)+1);
  const active=params.thread&&threadIds.includes(params.thread)?params.thread:undefined;
  let messages:any[]=[];
  if(active){const {data}=await supabase.from("messages").select("*").eq("conversation_id",active).order("created_at",{ascending:true});messages=data||[];}
  const current=rows.find((t)=>t.id===active);

  return <>
    <div className="page-head"><div><h1>Messages</h1><p>Client conversations stay attached to the application they came from.</p></div></div>

    {!rows.length ? <section className="workspace-empty-card" aria-labelledby="va-messages-empty-title">
      <div className="workspace-empty-icon"><MessageSquareText size={26}/></div>
      <h2 id="va-messages-empty-title">No conversations yet</h2>
      <p>Messages appear here after a client starts a conversation about one of your applications. You do not need to keep this page open.</p>
      <div className="row wrap workspace-empty-actions"><Link className="btn btn-primary" href="/workspace/va/jobs"><Search size={16}/>Find jobs</Link><Link className="btn" href="/workspace/va/applications"><FileText size={16}/>View applications</Link></div>
      <div className="workspace-empty-note"><strong>How it works:</strong> apply to a role, a client can message you from that application, and the conversation will show here automatically.</div>
    </section> : <div className={`messages-layout ${active?"has-active-thread":"no-active-thread"}`}>
      <div className="thread-list"><div className="thread-list-head"><strong>Conversations</strong><span className="thread-count">{rows.length}</span></div>{rows.map((t)=><Link className={`thread-item ${t.id===active?"active":""}`} href={`/workspace/va/messages?thread=${t.id}`} key={t.id}><div className="row-between"><strong>{t.applications?.jobs?.company_name||"Client"}</strong>{unread.get(t.id)?<span className="unread-dot" aria-label={`${unread.get(t.id)} unread messages`}>{unread.get(t.id)}</span>:null}</div><div className="small muted">{t.applications?.jobs?.title||"Job conversation"}</div></Link>)}</div>
      <div className="message-panel">{active?<><MarkThreadRead conversationId={active}/><div className="message-head"><Link className="mobile-thread-back" href="/workspace/va/messages"><ChevronLeft size={17}/> Conversations</Link><strong>{current?.applications?.jobs?.company_name||"Client conversation"}</strong><div className="small muted">{current?.applications?.jobs?.title}</div></div><div className="message-body">{messages.length?messages.map((m:any)=><div className={`bubble ${m.sender_id===user.id?"mine":""}`} key={m.id}>{m.body}{m.attachment_path?<div className="message-attachment"><a href={`/api/message-attachment/${m.id}`} target="_blank" rel="noreferrer">Open attachment: {m.attachment_name||"file"}</a></div>:null}<div className="small muted" style={{marginTop:4}}>{new Date(m.created_at).toLocaleString()}</div></div>):<div className="empty">No messages yet. Start the conversation below.</div>}</div><form action={sendMessageAction} className="message-form" encType="multipart/form-data"><input type="hidden" name="conversation_id" value={active}/><label className="sr-only" htmlFor="va-message">Write a message</label><input id="va-message" name="body" placeholder="Write a message..." autoComplete="off" maxLength={5000}/><label className="btn btn-sm message-attach-button">Attach<input className="sr-only" type="file" name="attachment" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"/></label><button className="btn btn-primary" type="submit">Send</button></form></>:<div className="message-placeholder-card"><MessageSquareText size={26}/><h2>Select a conversation</h2><p>Choose a client thread from the left to read the history and reply.</p></div>}</div>
    </div>}
  </>;
}
