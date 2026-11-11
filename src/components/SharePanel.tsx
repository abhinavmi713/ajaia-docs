"use client";

import { useState } from "react";

export interface Person {
  id: string;
  name: string;
  email: string;
}

export function SharePanel({
  docId,
  isOwner,
  owner,
  initialShared,
}: {
  docId: string;
  isOwner: boolean;
  owner: Person;
  initialShared: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(initialShared);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function share(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/documents/${docId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not share");
      setShared((s) => (s.some((p) => p.id === data.user.id) ? s : [...s, data.user]));
      setMsg({ kind: "ok", text: `Shared with ${data.user.name}` });
      setEmail("");
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(p: Person) {
    setMsg(null);
    const res = await fetch(`/api/documents/${docId}/shares?userId=${encodeURIComponent(p.id)}`, {
      method: "DELETE",
    });
    if (res.ok) setShared((s) => s.filter((x) => x.id !== p.id));
    else setMsg({ kind: "err", text: "Could not remove access" });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-blue-600 text-white px-4 py-1.5 text-sm font-medium hover:bg-blue-700"
        aria-expanded={open}
      >
        {isOwner ? "Share" : "People"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 space-y-3 z-20">
          <h3 className="font-medium text-slate-900">{isOwner ? "Share document" : "People with access"}</h3>
          {isOwner && (
            <form onSubmit={share} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. bob@demo.com"
                aria-label="Email to share with"
                className="flex-1 min-w-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
              <button disabled={busy} className="rounded-md bg-blue-600 text-white px-3 text-sm disabled:opacity-60">
                {busy ? "…" : "Add"}
              </button>
            </form>
          )}
          {msg && (
            <p className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-red-600"}`} role="status">
              {msg.text}
            </p>
          )}
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>
                {owner.name} <span className="text-slate-400">{owner.email}</span>
              </span>
              <span className="text-slate-500">Owner</span>
            </li>
            {shared.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <span className="truncate">
                  {p.name} <span className="text-slate-400">{p.email}</span>
                </span>
                {isOwner ? (
                  <button onClick={() => revoke(p)} className="text-xs text-red-600 hover:underline shrink-0 ml-2">
                    Remove
                  </button>
                ) : (
                  <span className="text-slate-500">Editor</span>
                )}
              </li>
            ))}
          </ul>
          {isOwner && (
            <p className="text-xs text-slate-500">
              Editors can read and edit. Only the owner can rename, share or delete.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
