"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error(error);fetch("/api/errors",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:error.message,digest:error.digest,path:window.location.pathname})}).catch(()=>{});},[error]);
  return <main id="main-content" className="auth-page"><div className="auth-card stack"><div><div className="kicker">Something went wrong</div><h1>We couldn’t complete that action.</h1><p className="muted">Try again. If it keeps happening, the error has been logged for the internal health screen.</p></div><div className="row wrap"><button className="btn btn-primary" onClick={reset}>Try again</button><Link className="btn" href="/">Go to homepage</Link></div>{error.digest?<p className="small muted">Reference: {error.digest}</p>:null}</div></main>;
}
