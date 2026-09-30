import Script from "next/script";

type TurnstileAction = "login" | "join" | "password_reset" | "resend_confirmation" | "contact" | "discovery_booking" | "service_match" | "industry_match" | "role_brief" | "training_join";

export function TurnstileWidget({ action }: { action: TurnstileAction }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) return null;

  return (
    <div className="turnstile-wrap">
      <div className="cf-turnstile" data-sitekey={siteKey} data-action={action}/>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/>
    </div>
  );
}
