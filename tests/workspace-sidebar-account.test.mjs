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

test("workspace sidebar renders the saved account avatar with a colored initials fallback",async()=>{
  const [shell,css]=await Promise.all([
    read("src/components/app-shell.tsx"),
    read("src/app/dashboard-premium.css"),
  ]);
  assert.match(shell,/avatarUrl\?: string \| null/);
  assert.match(shell,/avatarUrl \? <img src=\{avatarUrl\}/);
  assert.match(shell,/accountInitials\(name\)/);
  assert.match(shell,/has-initials/);
  assert.match(shell,/<strong>\{initials\}<\/strong>/);
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


test("workspace navigation gives icons distinct restrained color treatments",async()=>{
  const [nav,css]=await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/dashboard-premium.css"),
  ]);
  assert.match(nav,/app-nav-icon nav-tone-/);
  assert.match(nav,/navToneFor\(label, href\)/);
  assert.match(css,/\.app-nav-icon \{/);
  assert.match(css,/\.nav-tone-violet/);
  assert.match(css,/\.nav-tone-emerald/);
  assert.match(css,/\.nav-tone-amber/);
  assert.match(css,/\.nav-tone-rose/);
  assert.match(css,/app-nav-mobile > a \.app-nav-icon/);
});


test("shared account footer uses role-aware avatar tones and a styled sign-out icon",async()=>{
  const [shell,css]=await Promise.all([
    read("src/components/app-shell.tsx"),
    read("src/app/dashboard-premium.css"),
  ]);

  assert.match(shell,/workspace-role-\$\{role\}/);
  assert.match(shell,/app-account-chevron/);
  assert.match(shell,/app-logout-icon/);

  for(const role of ["client","recruiter","admin"]){
    assert.match(css,new RegExp(`workspace-role-${role} \\.sidebar-footer`));
  }

  assert.match(css,/\.app-account-avatar\.has-initials strong/);
  assert.match(css,/\.app-logout-icon/);
  assert.match(css,/\.app-account-card:hover/);
});

test("all four workspace roles share the colored navigation icon renderer",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/const nav: Record<Role/);
  for(const role of ["client","va","recruiter","admin"]){
    assert.match(nav,new RegExp(`\\b${role}: \\\[`));
  }
  assert.match(nav,/app-nav-icon nav-tone-/);
  assert.match(nav,/navToneFor\(label, href\)/);
});
