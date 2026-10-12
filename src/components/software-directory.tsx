"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";

type SoftwareGuide = {
  slug: string;
  software: string;
  category: string;
  focus: string;
  tasks: string[];
};

function searchableText(guide: SoftwareGuide) {
  return [guide.software, guide.category, guide.focus, ...guide.tasks]
    .join(" ")
    .toLocaleLowerCase();
}

export function SoftwareDirectory({ guides }: { guides: SoftwareGuide[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All software");
  const categories = useMemo(
    () => ["All software", ...new Set(guides.map((guide) => guide.category))],
    [guides]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleGuides = useMemo(
    () => guides.filter((guide) =>
      (category === "All software" || guide.category === category) &&
      searchableText(guide).includes(normalizedQuery)
    ),
    [guides, category, normalizedQuery]
  );
  const visibleGroups = categories
    .filter((entry) => entry !== "All software")
    .map((entry) => ({
      category: entry,
      guides: visibleGuides.filter((guide) => guide.category === entry),
    }))
    .filter((group) => group.guides.length > 0);

  const clearFilters = () => {
    setQuery("");
    setCategory("All software");
  };

  return (
    <section id="software-directory" className="sw-directory" aria-labelledby="sw-directory-title">
      <div className="container">
        <div className="sw-directory-heading">
          <div>
            <span className="sw-section-label">Software library</span>
            <h2 id="sw-directory-title">Find your platform.</h2>
            <p>Search by software name, industry, or the work you want to delegate.</p>
          </div>
          <Link className="sw-directory-hire" href="/hire">
            Need help choosing? <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="sw-toolbar">
          <label className="sw-search" htmlFor="software-search">
            <Search size={19} aria-hidden="true" />
            <span className="sw-sr-only">Search software or tasks</span>
            <input
              id="software-search"
              type="search"
              placeholder="Search software, tools, or tasks..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
          </label>
          <span className="sw-toolbar-count" role="status" aria-live="polite">
            {visibleGuides.length} of {guides.length} guides
          </span>
        </div>

        <div className="sw-filters" role="group" aria-label="Filter by industry">
          {categories.map((entry) => {
            const count = entry === "All software"
              ? guides.length
              : guides.filter((guide) => guide.category === entry).length;
            return (
              <button
                key={entry}
                type="button"
                className={entry === category ? "sw-filter is-active" : "sw-filter"}
                aria-pressed={entry === category}
                onClick={() => setCategory(entry)}
              >
                {entry} <span>{count}</span>
              </button>
            );
          })}
        </div>

        {visibleGroups.length ? (
          <div className="sw-groups">
            {visibleGroups.map((group) => (
              <section className="sw-group" key={group.category} aria-label={group.category}>
                <div className="sw-group-heading">
                  <h3>{group.category}</h3>
                  <span>{group.guides.length} {group.guides.length === 1 ? "guide" : "guides"}</span>
                </div>
                <div className="sw-card-grid">
                  {group.guides.map((guide) => (
                    <Link
                      key={guide.slug}
                      className="sw-card"
                      href={`/software/${guide.slug}`}
                      aria-label={`View ${guide.software} virtual assistant guide`}
                    >
                      <div className="sw-card-top">
                        <span className="sw-card-mark" aria-hidden="true">{guide.software.charAt(0).toUpperCase()}</span>
                        <ArrowRight className="sw-card-arrow" size={18} aria-hidden="true" />
                      </div>
                      <h4>{guide.software}</h4>
                      <p>{guide.focus.replace(/^./, (letter) => letter.toUpperCase())}</p>
                      <div className="sw-card-tasks" aria-label="Example tasks">
                        {guide.tasks.slice(0, 2).map((task) => <span key={task}>{task}</span>)}
                      </div>
                      <span className="sw-card-link">Explore hiring guide <ArrowRight size={15} aria-hidden="true" /></span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="sw-empty" role="status">
            <div className="sw-empty-icon"><Search size={24} aria-hidden="true" /></div>
            <h3>No matching software guides</h3>
            <p>Try a different software name or task, or browse all available platforms.</p>
            <button type="button" className="sw-clear" onClick={clearFilters}>
              <X size={15} aria-hidden="true" /> Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
