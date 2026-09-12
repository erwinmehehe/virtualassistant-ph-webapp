"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function VaOnboardingGate({ needsQuickSetup, children }: { needsQuickSetup: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldRedirect = needsQuickSetup && pathname === "/workspace/va";

  useEffect(() => {
    if (shouldRedirect) router.replace("/workspace/va/onboarding");
  }, [router, shouldRedirect]);

  if (shouldRedirect) {
    return <div className="card"><strong>Finish your quick setup first</strong><p className="muted" style={{ marginBottom: 0 }}>Taking you to the short setup so recruiters can start understanding your experience and specialty.</p></div>;
  }

  return <>{children}</>;
}
