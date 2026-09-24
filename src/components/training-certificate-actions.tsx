"use client";

import { Check, Printer, Share2 } from "lucide-react";
import { useState } from "react";

export function TrainingCertificateActions({
  href,
  courseTitle,
  showPrint = false,
}: {
  href: string;
  courseTitle: string;
  showPrint?: boolean;
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
    <>
      <button className="btn btn-sm training-certificate-share" type="button" onClick={copyOrShare} data-track="training_certificate_share">
        {copied ? <Check size={14} /> : <Share2 size={14} />}
        {copied ? "Copied" : "Copy / share link"}
      </button>
      {showPrint ? (
        <button
          className="btn btn-sm training-certificate-print"
          type="button"
          onClick={() => window.print()}
          data-track="training_certificate_print"
        >
          <Printer size={14} /> Print
        </button>
      ) : null}
    </>
  );
}
