import Link from "next/link";

export default function NotFound(){return <main id="main-content" className="auth-page"><div className="auth-card stack"><div><div className="kicker">404</div><h1>We couldn’t find that page.</h1><p className="muted">The link may be outdated, private, or no longer available.</p></div><div className="row wrap"><Link className="btn btn-primary" href="/">Go home</Link><Link className="btn" href="/find-talent">Find talent</Link></div></div></main>}
