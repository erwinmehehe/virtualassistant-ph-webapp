export type AccountDevice = {
  browser: string;
  os: string;
  device: string;
  deviceKey: string;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseAccountDevice(userAgent: string | null): AccountDevice {
  const ua = userAgent || "";

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua) || /CriOS\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua) || /FxiOS\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";

  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && /Mobile\//.test(ua));
  const isIPhone = /iPhone/.test(ua);
  const os = isIPad || isIPhone
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows NT/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";

  const device = isIPad
    ? "iPad"
    : isIPhone
      ? "iPhone"
      : /Android/.test(ua)
        ? "Android device"
        : /Windows NT/.test(ua)
          ? "Windows PC"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux device"
              : "Unknown device";

  return {
    browser,
    os,
    device,
    deviceKey: `${slug(browser)}:${slug(os)}:${slug(device)}`,
  };
}
