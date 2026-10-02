"use client";

import { Search } from "lucide-react";
import { useState } from "react";

export function TrainingDashboardSearch() {
  const [query,setQuery]=useState("");

  function update(value:string) {
    setQuery(value);
    window.dispatchEvent(new CustomEvent("vaph-training-search",{detail:{query:value}}));
  }

  function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value=query.trim();
    if(!value)return;
    const looksLikeQuestion=/\?$/.test(value)||/^ask\s+kiro\b/i.test(value);
    if(looksLikeQuestion){
      window.dispatchEvent(new CustomEvent("vaph-training-ask-kiro",{detail:{question:value.replace(/^ask\s+kiro[:\s-]*/i,"")||value}}));
      return;
    }
    window.dispatchEvent(new CustomEvent("vaph-training-search",{detail:{query:value}}));
  }

  return (
    <form className="training-dashboard-search" onSubmit={submit} role="search">
      <Search size={16}/>
      <label className="sr-only" htmlFor="training-dashboard-search-input">Search training</label>
      <input
        id="training-dashboard-search-input"
        type="search"
        value={query}
        onChange={(event)=>update(event.target.value)}
        placeholder="Search courses, lessons, or ask Kiro..."
        autoComplete="off"
      />
      <button className="sr-only" type="submit">Search or ask Kiro</button>
    </form>
  );
}
