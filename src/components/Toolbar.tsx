"use client";

import { type Editor, useEditorState } from "@tiptap/react";

export function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      paragraph: e.isActive("paragraph") && !e.isActive("heading"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const c = () => editor.chain().focus();
  const btn = (active: boolean) =>
    `h-8 min-w-8 px-2 rounded text-sm transition-colors disabled:opacity-40 ${
      active ? "bg-blue-100 text-blue-800" : "text-slate-700 hover:bg-slate-100"
    }`;
  const sep = <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden />;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      // Keep focus + selection in the editor when clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm"
    >
      <button type="button" title="Undo (Ctrl+Z)" className={btn(false)} disabled={!s.canUndo} onClick={() => c().undo().run()}>↶</button>
      <button type="button" title="Redo (Ctrl+Y)" className={btn(false)} disabled={!s.canRedo} onClick={() => c().redo().run()}>↷</button>
      {sep}
      <button type="button" title="Normal text" className={btn(s.paragraph)} onClick={() => c().setParagraph().run()}>Normal</button>
      <button type="button" title="Heading 1" className={btn(s.h1)} onClick={() => c().toggleHeading({ level: 1 }).run()}>H1</button>
      <button type="button" title="Heading 2" className={btn(s.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</button>
      {sep}
      <button type="button" title="Bold (Ctrl+B)" aria-pressed={s.bold} className={`${btn(s.bold)} font-bold`} onClick={() => c().toggleBold().run()}>B</button>
      <button type="button" title="Italic (Ctrl+I)" aria-pressed={s.italic} className={`${btn(s.italic)} italic`} onClick={() => c().toggleItalic().run()}>I</button>
      <button type="button" title="Underline (Ctrl+U)" aria-pressed={s.underline} className={`${btn(s.underline)} underline`} onClick={() => c().toggleUnderline().run()}>U</button>
      {sep}
      <button type="button" title="Bulleted list" aria-pressed={s.bullet} className={btn(s.bullet)} onClick={() => c().toggleBulletList().run()}>• List</button>
      <button type="button" title="Numbered list" aria-pressed={s.ordered} className={btn(s.ordered)} onClick={() => c().toggleOrderedList().run()}>1. List</button>
    </div>
  );
}
