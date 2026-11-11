"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const ACCEPT = ".txt,.md,.markdown,.docx";
const MAX_BYTES = 2 * 1024 * 1024;

export function ImportButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    // Client-side checks for fast feedback; the server re-validates everything.
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.split(",").includes(ext)) return setError("Unsupported file type. Use .txt, .md or .docx");
    if (file.size > MAX_BYTES) return setError("File is too large (max 2 MB)");

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.push(`/docs/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? "Importing…" : "Import file"}
      </button>
      <input ref={input} type="file" accept={ACCEPT} onChange={onChange} className="hidden" aria-label="Import file" />
      <p className="text-xs text-slate-500 mt-1">.txt, .md or .docx · max 2 MB</p>
      {error && <p className="text-sm text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
