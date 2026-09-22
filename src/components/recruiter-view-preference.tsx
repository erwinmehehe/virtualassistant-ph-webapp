"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function RecruiterViewPreference({
  storageKey,
  view,
  sort
}: {
  storageKey: string;
  view?: string;
  sort?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      if (view || sort) {
        localStorage.setItem(storageKey, JSON.stringify({ view: view || "", sort: sort || "" }));
        return;
      }
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { view?: string; sort?: string };
      if (!saved.view && !saved.sort) return;
      const params = new URLSearchParams(window.location.search);
      if (saved.view) params.set("view", saved.view);
      if (saved.sort) params.set("sort", saved.sort);
      router.replace(`${pathname}?${params.toString()}`);
    } catch {
      // Browser storage is optional; the page still works without it.
    }
  }, [pathname, router, sort, storageKey, view]);

  return null;
}
