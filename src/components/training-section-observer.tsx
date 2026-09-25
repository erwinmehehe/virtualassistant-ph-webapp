"use client";

import { useEffect } from "react";

const SECTION_IDS = [
  "course-library",
  "how-training-works",
  "certificate",
  "faq",
] as const;

export function TrainingSectionObserver() {
  useEffect(() => {
    if (window.location.pathname !== "/training") return;

    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const threshold = 132;
      let active: string | null = null;

      for (const id of SECTION_IDS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= threshold) {
          active = id;
        }
      }

      const links = document.querySelectorAll<HTMLAnchorElement>(".training-section-link[data-section]");
      links.forEach((link) => {
        const isActive = link.dataset.section === active;
        link.classList.toggle("is-active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, []);

  return null;
}
