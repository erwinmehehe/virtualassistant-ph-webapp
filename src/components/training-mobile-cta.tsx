"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function TrainingMobileCta({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-training-hero]");
    const finalCta = document.querySelector("[data-training-final-cta]");
    if (!hero || !finalCta) return;

    const update = () => {
      const heroRect = hero.getBoundingClientRect();
      const finalRect = finalCta.getBoundingClientRect();
      const heroGone = heroRect.bottom < 0;
      const finalVisible = finalRect.top < window.innerHeight;
      setVisible(heroGone && !finalVisible);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className={`tr-mobile-cta ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <Link
        href={href}
        data-track="training_account_click"
        data-cta-position="mobile_sticky"
        tabIndex={visible ? 0 : -1}
      >
        Start free training <ArrowRight size={15}/>
      </Link>
    </div>
  );
}
