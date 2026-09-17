"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MessageLiveSyncProps = {
  role: "client" | "va";
  userId: string;
  conversationIds: string[];
};

export function MessageLiveSync({ role, userId, conversationIds }: MessageLiveSyncProps) {
  const router = useRouter();
  const conversationKey = conversationIds.slice().sort().join(",");
  const ids = useMemo(() => new Set(conversationKey ? conversationKey.split(",") : []), [conversationKey]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const queueRefresh = () => {
      if (refreshTimer.current) return;
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        router.refresh();
      }, 350);
    };

    const ownerColumn = role === "client" ? "client_id" : "va_id";
    const channel = supabase
      .channel(`workspace-messages-${role}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const next = payload.new as { conversation_id?: string } | null;
          const previous = payload.old as { conversation_id?: string } | null;
          const conversationId = next?.conversation_id || previous?.conversation_id;
          if (conversationId && ids.has(conversationId)) queueRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `${ownerColumn}=eq.${userId}` },
        queueRefresh,
      )
      .subscribe();

    // Realtime is the fast path. This low-frequency fallback also recovers if a
    // browser sleeps, briefly loses its websocket, or a Realtime publication is
    // changed without leaving message screens stale indefinitely.
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 12000);

    return () => {
      clearInterval(poll);
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
      void supabase.removeChannel(channel);
    };
  }, [ids, role, router, userId]);

  return <span className="sr-only" aria-live="polite">Messages update automatically.</span>;
}
