"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function TrainingCertificateActions({
  href,
  courseTitle,
}: {
  href: string;
  courseTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyOrShare() {
    const url = new URL(href, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${courseTitle} credential`,
          text: `Verify my ${courseTitle} training credential.`,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="btn btn-sm training-certificate-share" type="button" onClick={copyOrShare}>
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "Copied" : "Copy / share link"}
    </button>
  );
}
