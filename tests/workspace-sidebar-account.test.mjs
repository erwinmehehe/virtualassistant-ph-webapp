import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("workspace sidebar removes the global help link",async()=>{
  const shell=await read("src/components/app-shell.tsx");
  assert.doesNotMatch(shell,/Help and support/);
  assert.doesNotMatch(shell,/className="app-support-link"/);
  assert.doesNotMatch(shell,/LifeBuoy/);
});

test("workspace sidebar renders the saved account avatar with an icon fallback",async()=>{
  const [shell,css]=await Promise.all([
    read("src/components/app-shell.tsx"),
    read("src/app/dashboard-premium.css"),
  ]);
  assert.match(shell,/avatarUrl\?: string \| null/);
  assert.match(shell,/avatarUrl \? <img src=\{avatarUrl\}/);
  assert.match(shell,/: <CircleUserRound size=\{18\}\/?>/);
  assert.match(css,/\.app-account-avatar img/);
  assert.match(css,/object-fit: cover/);
  assert.match(css,/overflow: hidden/);
});

test("every workspace shell passes the profile avatar",async()=>{
  const paths=[
    "src/app/workspace/recruiter/layout.tsx",
    "src/app/workspace/client/layout.tsx",
    "src/app/workspace/va/layout.tsx",
    "src/app/workspace/admin/layout.tsx",
    "src/app/workspace/account/page.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/avatarUrl=\{profile\.avatar_url\}/,`${path} should pass the saved avatar`);
  }
});
