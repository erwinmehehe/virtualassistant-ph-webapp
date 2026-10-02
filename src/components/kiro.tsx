import Image from "next/image";

export function Kiro({
  className = "",
  priority = false,
  alt = "Kiro, your VAPH hiring guide",
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
      className={className}
      sizes="(max-width: 680px) 104px, (max-width: 1100px) 200px, 260px"
    />
  );
}
