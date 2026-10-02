"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function TrainingDashboardSearch() {
  const [query,setQuery]=useState("");

  function update(value:string) {
    setQuery(value);
    window.dispatchEvent(new CustomEvent("vaph-training-search",{detail:{query:value}}));
  }

  return (
    <label className="training-dashboard-search">
      <Search size={16}/>
      <span className="sr-only">Search training</span>
      <input
        type="search"
        value={query}
        onChange={(event)=>update(event.target.value)}
        placeholder="Search courses, lessons, or ask Kiro..."
        autoComplete="off"
      />
    </label>
  );
}
