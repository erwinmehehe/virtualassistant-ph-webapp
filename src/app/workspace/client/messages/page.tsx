import { MessageCircle } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateClientRecruiterThread,
  getRecruiterClientMessages,
  markRecruiterClientMessagesRead,
} from "@/lib/recruiter-client-chat";
import { RecruiterClientChatPanel } from "@/components/recruiter-client-chat";
import pageStyles from "@/components/recruiter-client-chat-page.module.css";

export default async function ClientMessagesPage() {
  const { userId } = await requireRoleFast("client");
  const thread = await getOrCreateClientRecruiterThread(userId);
  await markRecruiterClientMessagesRead(thread.id, userId);

  const admin = createAdminClient();
  const [{ data: recruiter }, messages] = await Promise.all([
    thread.recruiter_id
      ? admin.from("profiles").select("full_name").eq("id", thread.recruiter_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getRecruiterClientMessages(thread.id),
  ]);

  const recruiterLabel = recruiter?.full_name || "VirtualAssistant.com.ph recruiting team";

  return <div className={pageStyles.page}>
    <div className="page-head">
      <div>
        <div className="kicker">Private messages</div>
        <h1>Chat with your recruiter</h1>
        <p>Your recruiter is your point of contact throughout hiring. Virtual Assistants are never participants in this conversation.</p>
      </div>
      <span className={pageStyles.ruleBadge}><MessageCircle size={15}/> Recruiter ↔ client only</span>
    </div>

    <RecruiterClientChatPanel
      viewerId={userId}
      threadId={thread.id}
      clientId={userId}
      counterpartLabel={recruiterLabel}
      messages={messages}
      returnTo="/workspace/client/messages"
      emptyCopy="Ask a hiring question, clarify the brief, or send feedback to your recruiter."
    />
  </div>;
}
