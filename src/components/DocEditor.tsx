"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Placeholder } from "@tiptap/extensions";
import { editorExtensions } from "@/lib/editor-extensions";
import { Toolbar } from "./Toolbar";
import { SharePanel, type Person } from "./SharePanel";

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const AUTOSAVE_MS = 800;

export function DocEditor(props: {
  id: string;
  initialTitle: string;
  initialContent: JSONContent;
  role: "owner" | "editor" | "viewer";
  owner: Person;
  sharedWith: Person[];
}) {
  const { id, role } = props;
  const isOwner = role === "owner";
  const canEdit = role !== "viewer";
  const router = useRouter();

  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(props.initialTitle);
  const savedTitle = useRef(props.initialTitle);
  const titleInput = useRef<HTMLInputElement>(null);

  // New documents: put the cursor in the title so the user names it first (like Google Docs).
  useEffect(() => {
    if (isOwner && props.initialTitle === "Untitled document") titleInput.current?.select();
  }, [isOwner, props.initialTitle]);

  // Autosave: debounce edits, never run two saves at once, and always save the latest content.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const pending = useRef<JSONContent | null>(null);

  async function flush() {
    if (inFlight.current || !pending.current) return;
    const content = pending.current;
    pending.current = null;
    inFlight.current = true;
    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Save failed (${res.status})`);
      setError(null);
      setStatus(pending.current ? "unsaved" : "saved");
    } catch (e) {
      // Keep the unsaved content so the next edit (or retry) sends it again.
      pending.current ??= content;
      setError((e as Error).message);
      setStatus("error");
    } finally {
      inFlight.current = false;
      if (pending.current) schedule();
    }
  }
  // Timers call the latest flush via a ref (avoids stale closures).
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flushRef.current(), AUTOSAVE_MS);
  }

  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      Placeholder.configure({ placeholder: canEdit ? "Start typing your document…" : "This document is empty." }),
    ],
    content: props.initialContent,
    editable: canEdit,
    immediatelyRender: false, // required with SSR
    editorProps: { attributes: { class: "doc-content", "aria-label": "Document content" } },
    onUpdate: ({ editor: e }) => {
      pending.current = e.getJSON();
      setStatus("unsaved");
      schedule();
    },
  });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status !== "saved") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  async function deleteDoc() {
    if (!window.confirm("Delete this document for everyone? This cannot be undone.")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
      setStatus("saved");
      router.push("/");
      router.refresh();
    } else setError((await res.json().catch(() => ({}))).error ?? "Delete failed");
  }

  async function saveTitle() {
    const next = title.trim();
    if (next === savedTitle.current) return setTitle(next);
    if (!next) {
      setTitle(savedTitle.current);
      return setError("Title cannot be empty");
    }
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Rename failed");
      savedTitle.current = next;
      setTitle(next);
      setError(null);
      document.title = `${next} · Ajaia Docs`;
    } catch (e) {
      setTitle(savedTitle.current);
      setError((e as Error).message);
    }
  }

  const statusText: Record<SaveStatus, string> = {
    saved: "All changes saved",
    unsaved: "Unsaved changes…",
    saving: "Saving…",
    error: "Not saved",
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
          <Link href="/" title="Back to documents" className="w-6 h-7 rounded-sm bg-blue-600 shrink-0" />
          <div className="flex-1 min-w-48">
            <input
              ref={titleInput}
              placeholder="Untitled document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                (e.target as HTMLInputElement).blur(); // triggers saveTitle
                setTimeout(() => editor?.commands.focus("start"), 0);
              }}
              readOnly={!isOwner}
              maxLength={200}
              aria-label="Document title"
              title={isOwner ? "Rename document" : "Only the owner can rename"}
              className="w-full text-lg font-medium text-slate-900 bg-transparent px-1 rounded border border-transparent border-dashed hover:border-slate-300 focus:border-solid focus:border-blue-500 focus:outline-none read-only:hover:border-transparent"
            />
            <div className="px-1 text-xs text-slate-500 flex gap-2">
              <span className={status === "error" ? "text-red-600" : ""} role="status">
                {canEdit ? statusText[status] : "View only"}
              </span>
              {!isOwner && <span>· Owned by {props.owner.name}</span>}
            </div>
          </div>
          {isOwner && (
            <button onClick={deleteDoc} className="text-sm text-slate-500 hover:text-red-600 px-2" title="Delete document">
              Delete
            </button>
          )}
          <SharePanel docId={id} isOwner={isOwner} owner={props.owner} initialShared={props.sharedWith} />
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-2 text-center" role="alert">
            {error}
            {status === "error" && (
              <button className="ml-3 underline" onClick={flush}>
                Retry
              </button>
            )}
          </div>
        )}
        {editor && canEdit && (
          <div className="max-w-5xl mx-auto px-4 pb-2 flex justify-center">
            <Toolbar editor={editor} />
          </div>
        )}
      </div>
      <main className="px-4 py-8">
        <div className="mx-auto max-w-[816px] min-h-[1056px] bg-white shadow-sm border border-slate-200 px-8 sm:px-24 py-16">
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
}
