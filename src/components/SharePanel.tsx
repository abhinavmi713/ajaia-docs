"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";

export type ShareRole = "editor" | "viewer";

export interface Person {
  id: string;
  name: string;
  email: string;
  role?: ShareRole;
}

const ROLE_LABEL: Record<ShareRole, string> = { editor: "Can edit", viewer: "Can view" };

export function SharePanel({
  docId,
  isOwner,
  owner,
  initialShared,
  onChange,
}: {
  docId: string;
  isOwner: boolean;
  owner: Person;
  initialShared: Person[];
  onChange?: (people: Person[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(initialShared);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function update(next: Person[]) {
    setShared(next);
    onChange?.(next);
  }

  async function grant(targetEmail: string, targetRole: ShareRole) {
    const res = await fetch(`/api/documents/${docId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role: targetRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Could not share");
    return data.user as Person;
  }

  async function share(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const user = await grant(email, role);
      const exists = shared.some((p) => p.id === user.id);
      update(exists ? shared.map((p) => (p.id === user.id ? user : p)) : [...shared, user]);
      setMsg({ kind: "ok", text: `${user.name} ${ROLE_LABEL[user.role ?? "editor"].toLowerCase()}` });
      setEmail("");
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(p: Person, next: ShareRole) {
    setMsg(null);
    try {
      const user = await grant(p.email, next);
      update(shared.map((x) => (x.id === p.id ? user : x)));
    } catch (err) {
      setMsg({ kind: "err", text: (err as Error).message });
    }
  }

  async function revoke(p: Person) {
    setMsg(null);
    const res = await fetch(`/api/documents/${docId}/shares?userId=${encodeURIComponent(p.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      update(shared.filter((x) => x.id !== p.id));
      setMsg({ kind: "ok", text: `Removed ${p.name}` });
    } else setMsg({ kind: "err", text: "Could not remove access" });
  }

  return (
    <div className="relative" ref={panel}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white pl-3 pr-4 py-1.5 text-sm font-medium hover:bg-blue-700 shadow-sm"
        aria-expanded={open}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
          <path d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm2 6H8V6a2 2 0 1 1 4 0v2Z" />
        </svg>
        {isOwner ? "Share" : "People"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-3 z-20">
          <h3 className="font-semibold text-slate-900">{isOwner ? "Share document" : "People with access"}</h3>
          {isOwner && (
            <form onSubmit={share} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add people by email"
                aria-label="Email to share with"
                className="flex-1 min-w-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                aria-label="Access level"
                className="rounded-md border border-slate-300 px-1.5 text-sm bg-white"
              >
                <option value="editor">Can edit</option>
                <option value="viewer">Can view</option>
              </select>
              <button disabled={busy} className="rounded-md bg-blue-600 text-white px-3 text-sm font-medium disabled:opacity-60">
                {busy ? "…" : "Add"}
              </button>
            </form>
          )}
          {isOwner && (
            <p className="text-xs text-slate-500">
              Try <code className="bg-slate-100 px-1 rounded">bob@demo.com</code> or{" "}
              <code className="bg-slate-100 px-1 rounded">carol@demo.com</code>
            </p>
          )}
          {msg && (
            <p className={`text-sm ${msg.kind === "ok" ? "text-green-700" : "text-red-600"}`} role="status">
              {msg.text}
            </p>
          )}
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <Avatar name={owner.name} id={owner.id} />
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-slate-900 truncate">{owner.name}</span>
                <span className="block text-xs text-slate-500 truncate">{owner.email}</span>
              </span>
              <span className="text-xs text-slate-500">Owner</span>
            </li>
            {shared.map((p) => (
              <li key={p.id} className="flex items-center gap-2.5">
                <Avatar name={p.name} id={p.id} />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-slate-900 truncate">{p.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{p.email}</span>
                </span>
                {isOwner ? (
                  <>
                    <select
                      value={p.role ?? "editor"}
                      onChange={(e) => changeRole(p, e.target.value as ShareRole)}
                      aria-label={`Access level for ${p.name}`}
                      className="text-xs rounded border border-slate-200 bg-white px-1 py-0.5"
                    >
                      <option value="editor">Can edit</option>
                      <option value="viewer">Can view</option>
                    </select>
                    <button
                      onClick={() => revoke(p)}
                      className="text-slate-400 hover:text-red-600 px-1"
                      title={`Remove ${p.name}`}
                      aria-label={`Remove ${p.name}`}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-500">{ROLE_LABEL[p.role ?? "editor"]}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
            Editors can read and edit · Viewers can only read · Only the owner can rename, share or delete.
          </p>
        </div>
      )}
    </div>
  );
}
