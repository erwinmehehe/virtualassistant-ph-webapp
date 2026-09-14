"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, UsersRound, X } from "lucide-react";

export type ShortlistTalent = {
  slug: string;
  name: string;
  headline?: string | null;
};

const STORAGE_KEY = "va_public_shortlist";
const EVENT_NAME = "va-shortlist-change";
const MAX_SHORTLIST = 5;

function readShortlist(): ShortlistTalent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((item) => item && typeof item.slug === "string" && typeof item.name === "string")
          .slice(0, MAX_SHORTLIST)
      : [];
  } catch {
    return [];
  }
}

function saveShortlist(items: ShortlistTalent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_SHORTLIST)));
  } catch {
    // Private browsing can block storage. The current interaction can still continue.
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function TalentShortlistButton({
  talent,
  className = "cro-shortlist-button",
}: {
  talent: ShortlistTalent;
  className?: string;
}) {
  const [items, setItems] = useState<ShortlistTalent[]>([]);

  useEffect(() => {
    const sync = () => setItems(readShortlist());
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const selected = items.some((item) => item.slug === talent.slug);
  const full = !selected && items.length >= MAX_SHORTLIST;

  const toggle = () => {
    const current = readShortlist();
    if (current.some((item) => item.slug === talent.slug)) {
      saveShortlist(current.filter((item) => item.slug !== talent.slug));
      return;
    }
    if (current.length >= MAX_SHORTLIST) return;
    saveShortlist([...current, talent]);
  };

  return (
    <button
      type="button"
      className={`${className}${selected ? " selected" : ""}`}
      onClick={toggle}
      disabled={full}
      aria-pressed={selected}
      aria-label={selected ? `Remove ${talent.name} from shortlist` : `Add ${talent.name} to shortlist`}
      title={full ? `Shortlist up to ${MAX_SHORTLIST} candidates` : undefined}
    >
      {selected ? <Check size={16} /> : <BookmarkPlus size={16} />}
      {selected ? "Shortlisted" : full ? "Shortlist full" : "Shortlist"}
    </button>
  );
}

export function TalentShortlistBar() {
  const [items, setItems] = useState<ShortlistTalent[]>([]);

  useEffect(() => {
    const sync = () => setItems(readShortlist());
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const href = useMemo(() => {
    if (!items.length) return "/hire";
    const params = new URLSearchParams();
    params.set("shortlist", items.map((item) => item.slug).join(","));
    return `/hire?${params.toString()}`;
  }, [items]);

  if (!items.length) return null;

  return (
    <div className="cro-shortlist-bar" role="complementary" aria-label="Candidate shortlist">
      <div className="cro-shortlist-bar-main">
        <span className="cro-shortlist-icon"><UsersRound size={17} /></span>
        <div>
          <strong>{items.length} candidate{items.length === 1 ? "" : "s"} shortlisted</strong>
          <small>Compare up to {MAX_SHORTLIST}, then send them to our recruiter.</small>
        </div>
      </div>
      <div className="cro-shortlist-bar-actions">
        <button
          className="cro-shortlist-clear"
          type="button"
          onClick={() => saveShortlist([])}
          aria-label="Clear shortlist"
        >
          <X size={15} />
        </button>
        <Link className="btn btn-primary" href={href} data-track="shortlist_hire_click">
          Interview this shortlist
        </Link>
      </div>
    </div>
  );
}
