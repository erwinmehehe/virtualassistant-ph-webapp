import Link from "next/link";
import { BookOpenCheck, CheckCircle2, GraduationCap } from "lucide-react";
import { joinTrainingAction } from "@/app/actions/training-auth";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function TrainingJoinForm({ error }: { error?: string }) {
  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-role-icon" aria-hidden="true"><GraduationCap size={24}/></div>
      <div className="kicker">Free training account</div>
      <h1>Learn without joining the talent marketplace</h1>
      <p className="muted auth-intro">
        Save your progress, complete practical VA training, and receive free completion certificates.
        Creating this account does not create a VA candidate profile or enter you into recruiter vetting.
      </p>

      {error ? <p className="alert" role="alert">{error}</p> : null}

      <div className="auth-benefits" aria-label="Free training account benefits">
        <div><CheckCircle2 size={16}/><span>Training, assessments, and completion certificates stay free</span></div>
        <div><CheckCircle2 size={16}/><span>No candidate profile or job application is required</span></div>
        <div><CheckCircle2 size={16}/><span>Your learning progress is saved across devices</span></div>
      </div>

      <form action={joinTrainingAction} className="stack auth-form">
        <div className="field">
          <label htmlFor="training-full-name">Full name</label>
          <input id="training-full-name" name="full_name" required minLength={2} maxLength={100} autoComplete="name"/>
        </div>
        <div className="field">
          <label htmlFor="training-email">Email</label>
          <input id="training-email" type="email" name="email" required autoComplete="email"/>
        </div>
        <div className="field">
          <label htmlFor="training-password">Password</label>
          <input
            id="training-password"
            type="password"
            name="password"
            minLength={12}
            maxLength={128}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}"
            title="Use 12+ characters with uppercase, lowercase, a number, and a symbol."
            required
            autoComplete="new-password"
          />
          <span className="small muted">12+ characters with uppercase, lowercase, a number, and a symbol.</span>
        </div>
        <TurnstileWidget/>
        <button className="btn btn-primary" type="submit"><BookOpenCheck size={16}/> Create free training account</button>
      </form>

      <p className="small muted auth-legal">
        By continuing, you agree to our <Link href="/terms" className="text-link">Terms</Link> and <Link href="/privacy" className="text-link">Privacy Policy</Link>.
      </p>
      <p className="small muted auth-login">
        Already have any VirtualAssistant.com.ph account?{" "}
        <Link href="/auth/login?next=%2Fworkspace%2Ftraining" className="text-link">Log in and use the same account</Link>.
      </p>
    </div>
  );
}
