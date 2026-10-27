"use client";

import Link from "next/link";

export default function EditJobError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container" style={{ paddingBlock: "3rem" }} role="alert">
      <div className="card" style={{ maxWidth: 620, marginInline: "auto", padding: "2rem" }}>
        <h1>We couldn't load your job</h1>
        <p>The hiring request is still saved. There was a temporary problem loading its editor. You can try again without losing your existing job.</p>
        <div className="row wrap" style={{ gap: "1rem", marginTop: "1.5rem" }}>
          <button className="btn btn-primary" type="button" onClick={() => reset()}>
            Try again
          </button>
          <Link className="btn" href="/workspace/client/jobs">Return to your jobs</Link>
        </div>
      </div>
    </div>
  );
}
