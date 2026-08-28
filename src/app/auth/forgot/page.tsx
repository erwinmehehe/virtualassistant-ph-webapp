import { SiteHeader } from "@/components/site-header";
import { requestPasswordResetAction } from "@/app/actions/auth";
export default function ForgotPage(){return <><SiteHeader/><main className="auth-page"><div className="auth-card"><h1>Reset your password</h1><p className="muted">Enter your account email and we will send a secure reset link.</p><form action={requestPasswordResetAction} className="stack"><div className="field"><label>Email</label><input type="email" name="email" required/></div><button className="btn btn-primary" type="submit">Send reset link</button></form></div></main></>}
