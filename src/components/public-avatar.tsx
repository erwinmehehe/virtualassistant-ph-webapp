const avatarPixels = { sm: 40, md: 64, lg: 96 } as const;

export function PublicAvatar({ name, src, size = "md" }: { name?: string | null; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const initials = String(name || "VA").split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  const pixels = avatarPixels[size];

  return <div className={`avatar avatar-${size}`}>
    {src ? <img
      src={src}
      alt={name ? `${name} profile photo` : "Virtual assistant profile"}
      width={pixels}
      height={pixels}
      loading="lazy"
      decoding="async"
    /> : initials}
  </div>;
}
