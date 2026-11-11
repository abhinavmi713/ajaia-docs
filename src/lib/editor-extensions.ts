import StarterKit from "@tiptap/starter-kit";

// Shared by the browser editor and the server-side file import, so imported
// content is guaranteed to fit the editor's schema.
// StarterKit (TipTap 3) includes bold, italic, underline, headings, lists, history.
export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false },
  }),
];
