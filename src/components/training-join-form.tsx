"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  MailCheck,
  RotateCcw,
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { joinTrainingAction } from "@/app/actions/training-auth";
import { initialTrainingJoinState } from "@/lib/training-auth-state";
import { resendSignupConfirmationAction } from "@/app/actions/resend-confirmation";
import { TurnstileWidget } from "@/components/turnstile-widget";
import {
  trainingCourseDestination,
  trainingLoginHref,
} from "@/lib/training-intent";

const COMMON_PASSWORD_PARTS = ["password", "qwerty", "letmein", "welcome", "admin", "iloveyou", "123456"];

export function TrainingJoinForm({
  course,
}: {
  course?: { slug: string; title: string } | null;
}) {
  const [state, formAction, pending] = useActionState(joinTrainingAction, initialTrainingJoinState);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const destination = trainingCourseDestination(course?.slug);
  const loginHref = trainingLoginHref(course?.slug);

  const passwordChecks = useMemo(() => ({
    length: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    uncommon: !COMMON_PASSWORD_PARTS.some((part) => password.toLowerCase().includes(part)),
  }), [password]);

  if (state.status === "success") {
    return (
      <div className="auth-card auth-card-wide training-signup-success">
        <div className="auth-role-icon training-success-icon" aria-hidden="true"><MailCheck size={24}/></div>
        <div className="kicker">One quick step left</div>
        <h1>Check your email</h1>
        <p className="muted auth-intro">{state.message}</p>

        <div className="training-confirmation-summary">
          <div>
            <span>Email</span>
            <strong>{state.email}</strong>
          </div>
          <div>
            <span>After confirmation</span>
            <strong>{state.courseTitle ? `Open ${state.courseTitle}` : "Open your training library"}</strong>
          </div>
        </div>

        <div className="auth-benefits training-confirmation-steps" aria-label="Confirmation steps">
          <div><CheckCircle2 size={16}/><span>Open the confirmation email we sent you.</span></div>
          <div><CheckCircle2 size={16}/><span>Confirm your account from that email.</span></div>
          <div><CheckCircle2 size={16}/><span>You will continue directly to {state.courseTitle || "your training"}.</span></div>
        </div>

        <div className="training-confirmation-actions">
          <Link className="btn btn-primary" href={trainingLoginHref(course?.slug)} data-track="training_login_click">
            I already confirmed
          </Link>

          <form action={resendSignupConfirmationAction}>
            <input type="hidden" name="email" value={state.email || email}/>
            <input type="hidden" name="next" value={state.next || destination}/>
            <button className="btn" type="submit">
              <RotateCcw size={15}/> Resend confirmation email
            </button>
          </form>
        </div>

        <p className="small muted auth-legal">
          Check your spam or promotions folder if the email does not arrive within a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card auth-card-wide">
      <div className="auth-role-icon" aria-hidden="true"><GraduationCap size={24}/></div>
      <div className="kicker">Free training account</div>
      <h1>Create your free training account</h1>
      <p className="muted auth-intro">
        {course ? (
          <>Create an account and we&apos;ll take you straight to <strong>{course.title}</strong> after email confirmation.</>
        ) : (
          <>Save your progress, complete practical VA training, and keep verified completion certificates.</>
        )}{" "}
        Training is separate from job applications. You can learn first and decide later whether you want to apply for VA roles.
      </p>

      {state.status === "error" ? <p className="alert" role="alert">{state.message}</p> : null}

      <div className="auth-benefits" aria-label="Free training account benefits">
        <div><CheckCircle2 size={16}/><span>All training and completion certificates stay free</span></div>
        <div><CheckCircle2 size={16}/><span>No job application is required to learn</span></div>
        <div><CheckCircle2 size={16}/><span>Your learning progress is saved across devices</span></div>
      </div>

      <form action={formAction} className="stack auth-form">
        {course ? <input type="hidden" name="course_slug" value={course.slug}/> : null}

        <div className="field">
          <label htmlFor="training-full-name">Full name</label>
          <input
            id="training-full-name"
            name="full_name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors.full_name)}
            aria-describedby={state.fieldErrors.full_name ? "training-full-name-error" : undefined}
          />
          {state.fieldErrors.full_name ? (
            <span className="field-error" id="training-full-name-error">{state.fieldErrors.full_name}</span>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="training-email">Email</label>
          <input
            id="training-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={state.fieldErrors.email ? "training-email-error" : undefined}
          />
          {state.fieldErrors.email ? (
            <span className="field-error" id="training-email-error">{state.fieldErrors.email}</span>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="training-password">Password</label>
          <div className="training-password-wrap">
            <input
              id="training-password"
              type={showPassword ? "text" : "password"}
              name="password"
              minLength={12}
              maxLength={128}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(state.fieldErrors.password)}
              aria-describedby="training-password-help"
            />
            <button
              className="training-password-toggle"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          </div>
          {state.fieldErrors.password ? <span className="field-error">{state.fieldErrors.password}</span> : null}

          <div className="training-password-checks" id="training-password-help">
            {[
              [passwordChecks.length, "12+ characters"],
              [passwordChecks.upper, "Uppercase"],
              [passwordChecks.lower, "Lowercase"],
              [passwordChecks.number, "Number"],
              [passwordChecks.symbol, "Symbol"],
              [passwordChecks.uncommon, "No common password phrase"],
            ].map(([ok, label]) => (
              <span className={ok ? "is-valid" : ""} key={String(label)}>
                <Check size={12}/>{label}
              </span>
            ))}
          </div>
        </div>

        <TurnstileWidget key={state.attempt}/>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={pending}
          data-track="training_signup_submit_click"
          data-course-slug={course?.slug}
        >
          <BookOpenCheck size={16}/>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="small muted auth-legal">
        By continuing, you agree to our <Link href="/terms" className="text-link">Terms</Link> and <Link href="/privacy" className="text-link">Privacy Policy</Link>.
      </p>
      <p className="small muted auth-login">
        Already have any VirtualAssistant.com.ph account?{" "}
        <Link href={loginHref} className="text-link" data-track="training_login_click">
          Log in and use the same account
        </Link>.
      </p>
    </div>
  );
}
