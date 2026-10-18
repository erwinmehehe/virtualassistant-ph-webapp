"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type TurnstileAction = "login" | "join" | "password_reset" | "resend_confirmation" | "contact" | "discovery_booking" | "service_match" | "industry_match" | "role_brief" | "training_join";

type TurnstileClient = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: TurnstileAction;
      "response-field": false;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "timeout-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileClient;
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

export function TurnstileWidget({ action }: { action: TurnstileAction }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const submittedRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "expired" | "error">("loading");
  const { pending } = useFormStatus();

  const resetChallenge = useCallback(() => {
    setToken("");
    const api = window.turnstile;
    const widgetId = widgetIdRef.current;
    if (!api || !widgetId) {
      setStatus("error");
      return;
    }
    try {
      api.reset(widgetId);
      setStatus("loading");
    } catch {
      setStatus("error");
    }
  }, []);

  // Next.js client-side navigation can mount this form after the shared Script
  // has loaded. Turnstile auto-render only scans at script initialization, so
  // use explicit rendering on every mount, and remove obsolete widgets.
  useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current) return;
    const api = window.turnstile;
    if (!api) {
      setStatus("error");
      return;
    }

    let widgetId: string | null = null;
    try {
      widgetId = api.render(containerRef.current, {
        sitekey: siteKey,
        action,
        "response-field": false,
        callback: (responseToken) => {
          setToken(responseToken);
          setStatus("ready");
        },
        "expired-callback": () => {
          setToken("");
          setStatus("expired");
        },
        "error-callback": () => {
          setToken("");
          setStatus("error");
        },
        "timeout-callback": () => {
          setToken("");
          setStatus("expired");
        },
      });
      if (widgetId) {
        widgetIdRef.current = widgetId;
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }

    return () => {
      if (widgetId) {
        try {
          api.remove(widgetId);
        } catch {
          // The widget may have been removed during navigation.
        }
      }
      if (widgetIdRef.current === widgetId) widgetIdRef.current = null;
    };
  }, [action, scriptReady]);

  // A Turnstile token is single-use. If an action fails and leaves this form
  // mounted (for example, wrong password or validation error), do not submit
  // the consumed response again: request a fresh challenge automatically.
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current) {
      submittedRef.current = false;
      if (siteKey) resetChallenge();
    }
  }, [pending, resetChallenge]);

  if (!siteKey) return null;

  return (
    <div className="turnstile-wrap">
      <div ref={containerRef} data-turnstile-action={action}/>
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly/>
      {(status === "error" || status === "expired") ? (
        <div role="status" aria-live="polite" className="small muted">
          <p>
            {status === "expired"
              ? "The security check expired. Complete a new check to continue."
              : "The security check could not load or complete. Please retry it before submitting."}
          </p>
          <button
            className="btn btn-sm"
            type="button"
            onClick={() => {
              if (window.turnstile && widgetIdRef.current) resetChallenge();
              else window.location.reload();
            }}
          >
            Retry security check
          </button>
        </div>
      ) : null}
      <noscript><p className="small muted">Enable JavaScript to complete the security check.</p></noscript>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setStatus("error")}
      />
    </div>
  );
}
