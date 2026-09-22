import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("workspace shell keeps two intentional home affordances",async()=>{
  const shell=await read("src/components/app-shell.tsx");
  const homeLinks=(shell.match(/href=\{workspaceHome\[role\]\}/g)||[]).length;
  assert.equal(homeLinks,2);
  assert.match(shell,/className="app-brand"/);
  assert.match(shell,/className="app-topbar-workspace-home"/);
  assert.doesNotMatch(shell,/className="app-workspace-card"/);
});

test("recruiter workspace home resolves to My Day",async()=>{
  const shell=await read("src/components/app-shell.tsx");
  assert.match(shell,/recruiter:\s*"\/workspace\/recruiter\/today"/);
});

test("topbar workspace link keeps workspace styling and hides on mobile",async()=>{
  const css=await read("src/app/dashboard-premium.css");
  assert.match(css,/\.app-topbar-workspace-home\s*\{/);
  assert.match(css,/\.app-topbar-workspace-home:hover/);
  assert.match(css,/\.app-topbar-workspace-home \{ display: none; \}/);
});
