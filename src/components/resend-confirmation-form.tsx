"use client";

import { useFormStatus } from "react-dom";
import { resendSignupConfirmationAction } from "@/app/actions/resend-confirmation";
import { TurnstileWidget } from "@/components/turnstile-widget";

function ResendConfirmationSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-sm" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Resend"}
    </button>
  );
}

/**
 * The recovery form appears only after an unconfirmed-login Server Action
 * redirects back to this page. Render the action and Turnstile challenge in
 * one hydrated client boundary so the newly inserted form can submit.
 * Server-side validation, single-use Turnstile checks and rate limits remain
 * in resendSignupConfirmationAction.
 */
export function ResendConfirmationForm({ next, lead }: { next?: string; lead?: string }) {
  return (
    <form action={resendSignupConfirmationAction} className="auth-confirmation-form">
      {next ? <input type="hidden" name="next" value={next}/> : null}
      {lead ? <input type="hidden" name="lead" value={lead}/> : null}
      <label htmlFor="confirmation-email" className="sr-only">Confirmation email</label>
      <input
        id="confirmation-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="Email address"
      />
      <TurnstileWidget action="resend_confirmation"/>
      <ResendConfirmationSubmit/>
    </form>
  );
}
