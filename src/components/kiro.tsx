import Image from "next/image";

export function Kiro({
  className = "",
  priority = false,
  alt = "",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src="/brand/kiro/kiro-default.webp"
      alt={alt}
      width={160}
      height={160}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
