// Smoke test for server-side access control against a running server.
// Usage: npm run dev, then: node --env-file=.env scripts/smoke-acl.mjs

import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const tok = async (email) => {
  const u = await p.user.findUniqueOrThrow({ where: { email } });
  return "ajaia_session=" + (await new SignJWT({}).setProtectedHeader({ alg: "HS256" }).setSubject(u.id).setExpirationTime("1h").sign(key));
};
const B = process.env.BASE_URL ?? "http://localhost:3000";
const [A, Bo, C] = [await tok("alice@demo.com"), await tok("bob@demo.com"), await tok("carol@demo.com")];
const welcome = await p.document.findFirstOrThrow({ where: { title: "Welcome to Ajaia Docs" } });
const req = async (label, cookie, method, path, body) => {
  const r = await fetch(B + path, { method, headers: { cookie, "content-type": "application/json" }, body: body && JSON.stringify(body), redirect: "manual" });
  const t = await r.text();
  console.log(r.status, label, t.slice(0, 90));
};
const id = welcome.id;
await req("bob (editor) edits content        ->200", Bo, "PATCH", `/api/documents/${id}`, { content: welcome.content });
await req("bob renames                       ->403", Bo, "PATCH", `/api/documents/${id}`, { title: "hijack" });
await req("bob shares                        ->403", Bo, "POST", `/api/documents/${id}/shares`, { email: "carol@demo.com" });
await req("bob deletes                       ->403", Bo, "DELETE", `/api/documents/${id}`);
await req("carol (stranger) edits            ->404", C, "PATCH", `/api/documents/${id}`, { content: welcome.content });
await req("carol opens page                  ->404", C, "GET", `/docs/${id}`);
await req("alice empty title                 ->400", A, "PATCH", `/api/documents/${id}`, { title: "   " });
await req("alice bad content                 ->400", A, "PATCH", `/api/documents/${id}`, { content: { type: "nope" } });
await req("alice share unknown user          ->404", A, "POST", `/api/documents/${id}/shares`, { email: "nobody@demo.com" });
await req("alice share bad email             ->400", A, "POST", `/api/documents/${id}/shares`, { email: "not-an-email" });
await req("alice share with herself          ->400", A, "POST", `/api/documents/${id}/shares`, { email: "alice@demo.com" });
await req("no cookie                         ->401", "", "PATCH", `/api/documents/${id}`, { title: "x" });
await req("forged cookie                     ->401", "ajaia_session=abc.def.ghi", "PATCH", `/api/documents/${id}`, { title: "x" });
await p.$disconnect();
