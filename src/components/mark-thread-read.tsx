"use client";

import { useEffect } from "react";
import { markConversationReadAction } from "@/app/actions/messages";

export function MarkThreadRead({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    const data = new FormData();
    data.set("conversation_id", conversationId);
    void markConversationReadAction(data);
  }, [conversationId]);
  return null;
}
