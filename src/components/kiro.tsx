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
      width={1024}
      height={1024}
      priority={priority}
      quality={95}
      sizes="(max-width: 420px) 108px, (max-width: 680px) 124px, (max-width: 900px) 190px, 220px"
      className={className}
    />
  );
}
