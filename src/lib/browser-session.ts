const SESSION_KEY = "va_ph_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

function validSessionId(value: string | null | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

function cookieValue() {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${SESSION_KEY}=`))
    ?.slice(SESSION_KEY.length + 1);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function persist(value: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${secure}`;
  try {
    window.sessionStorage.setItem(SESSION_KEY, value);
  } catch {
    // The cookie remains the source of truth when sessionStorage is blocked.
  }
}

export function getBrowserSessionId() {
  if (typeof window === "undefined") return "";

  try {
    const cookie = cookieValue();
    if (validSessionId(cookie)) {
      try {
        window.sessionStorage.setItem(SESSION_KEY, cookie as string);
      } catch {
        // Best effort only.
      }
      return cookie as string;
    }

    const legacy = (() => {
      try {
        return window.sessionStorage.getItem(SESSION_KEY);
      } catch {
        return null;
      }
    })();
    if (validSessionId(legacy)) {
      persist(legacy as string);
      return legacy as string;
    }

    const value = crypto.randomUUID();
    persist(value);
    return value;
  } catch {
    return "";
  }
}
