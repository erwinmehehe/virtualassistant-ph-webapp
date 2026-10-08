import Link from "next/link";

export default function ProposalNotFound() {
  return (
    <main id="main-content" className="auth-page">
      <div className="auth-card stack">
        <div>
          <div className="kicker">Proposal unavailable</div>
          <h1>We couldn’t find this hiring proposal.</h1>
          <p className="muted">
            This link may have expired, been replaced by a newer proposal, or been entered incorrectly.
            Please return to the email from your recruiter for the latest secure link.
          </p>
        </div>
        <div className="row wrap">
          <Link className="btn btn-primary" href="/contact">Contact the recruiting team</Link>
          <Link className="btn" href="/">Go to homepage</Link>
        </div>
        <p className="small muted">For privacy, proposal pages are never indexed by search engines.</p>
      </div>
    </main>
  );
}
