"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{ console.error(error); },[error]);
  return <main id="main-content" className="auth-page"><div className="auth-card stack"><div><div className="kicker">Something went wrong</div><h1>We couldn’t complete that action.</h1><p className="muted">Your data has not been intentionally discarded. Try the action again; if the problem continues, return to your workspace and retry from there.</p></div><div className="row wrap"><button className="btn btn-primary" onClick={reset}>Try again</button><Link className="btn" href="/">Go to homepage</Link></div>{error.digest?<p className="small muted">Reference: {error.digest}</p>:null}</div></main>;
}
