import { requireRoleFast } from "@/lib/auth";
import { RecruiterVaChatPage } from "@/lib/recruiter-va-chat-page";

export default async function Page({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const { userId } = await requireRoleFast("va");
  return <RecruiterVaChatPage role="va" userId={userId} requestedThread={(await searchParams).thread}/>;
}
