"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TrainingDashboardSearch() {
  const [query,setQuery]=useState("");
  const inputRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const setHandler=(event:Event)=>{
      const custom=event as CustomEvent<{query?:string}>;
      setQuery(custom.detail?.query||"");
    };
    const keyHandler=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      const typing=target?.tagName==="INPUT"||target?.tagName==="TEXTAREA"||target?.isContentEditable;
      if(event.key==="/"&&!typing){
        event.preventDefault();
        inputRef.current?.focus();
      }
      if(event.key==="Escape"&&document.activeElement===inputRef.current){
        update("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("vaph-training-search-set",setHandler);
    window.addEventListener("keydown",keyHandler);
    return()=>{
      window.removeEventListener("vaph-training-search-set",setHandler);
      window.removeEventListener("keydown",keyHandler);
    };
  },[]);

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
        ref={inputRef}
        id="training-dashboard-search-input"
        type="search"
        value={query}
        onChange={(event)=>update(event.target.value)}
        placeholder="Search courses, lessons, or ask Kiro..."
        autoComplete="off"
      />
      <kbd className="training-dashboard-search-shortcut" aria-hidden="true">/</kbd>
      <button className="sr-only" type="submit">Search or ask Kiro</button>
    </form>
  );
}
