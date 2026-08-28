"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

// Workspace-scoped error boundary. Without one, any throw inside a dashboard
// escapes to the root error page and takes the sidebar with it, dumping the
// user out of the workspace entirely.
export function WorkspaceError({ error, reset, home }: { error: Error & { digest?: string }; reset: () => void; home: string }) {
  useEffect(() => {
    console.error(error);
    fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: error.message, digest: error.digest, path: window.location.pathname })
    }).catch(() => {});
  }, [error]);

  return (
    <section className="card workspace-error">
      <div className="workspace-error-icon"><AlertTriangle size={22} /></div>
      <div>
        <h2>This page didn’t load.</h2>
        <p className="muted">Your data is safe — the page failed to render, nothing was changed. Try again, and if it keeps happening the error has been logged for the internal health screen.</p>
        <div className="row wrap">
          <button className="btn btn-primary" onClick={reset} type="button">Try again</button>
          <Link className="btn" href={home}>Back to overview</Link>
        </div>
        {error.digest ? <p className="small muted">Reference: {error.digest}</p> : null}
      </div>
    </section>
  );
}
