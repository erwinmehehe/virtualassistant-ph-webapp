const DEFAULT_ORIGIN = "https://virtualassistant.com.ph";

export function canonicalPath(pathname: string) {
  const raw = String(pathname || "/").trim();
  if (!raw || raw === "/") return "/";
  const withoutQuery = raw.split(/[?#]/, 1)[0] || "/";
  return `/${withoutQuery.replace(/^\/+|\/+$/g, "")}`;
}

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_ORIGIN).replace(/\/+$/, "");
}

export function canonicalUrl(pathname: string) {
  return `${siteOrigin()}${canonicalPath(pathname)}`;
}
