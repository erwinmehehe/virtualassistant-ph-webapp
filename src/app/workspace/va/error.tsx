"use client";
import { WorkspaceError } from "@/components/workspace-error";
export default function Error({error,reset}:{error:Error&{digest?:string};reset:()=>void}){return <WorkspaceError error={error} reset={reset} home="/workspace/va"/>}
