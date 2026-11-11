// Converts an uploaded file into TipTap JSON using the *same* schema as the editor.
// Unknown/unsafe HTML (scripts, styles, iframes...) is dropped by the schema parser.
import { generateJSON } from "@tiptap/html/server";
import { marked } from "marked";
import mammoth from "mammoth";
import { editorExtensions } from "./editor-extensions";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;
export const ACCEPT_ATTR = ".txt,.md,.markdown,.docx";

export class ImportError extends Error {}

export function extensionOf(filename: string) {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function titleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, 200);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text: blank lines separate paragraphs, single newlines become line breaks. */
export function textToHtml(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export async function fileToDocContent(filename: string, data: Buffer) {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError(`Unsupported file type "${ext || "none"}". Supported: .txt, .md, .docx`);
  }
  if (data.length === 0) throw new ImportError("The file is empty");
  if (data.length > MAX_UPLOAD_BYTES) throw new ImportError("File is too large (max 2 MB)");

  let html: string;
  if (ext === ".docx") {
    try {
      // mammoth ignores underline by default; map it explicitly so formatting survives.
      html = (await mammoth.convertToHtml({ buffer: data }, { styleMap: ["u => u"] })).value;
    } catch {
      throw new ImportError("Could not read this .docx file. Is it a valid Word document?");
    }
  } else {
    const text = data.toString("utf8");
    if (text.includes("\u0000")) throw new ImportError("This doesn't look like a text file");
    html = ext === ".txt" ? textToHtml(text) : await marked.parse(text, { gfm: true });
  }

  const content = generateJSON(html || "<p></p>", editorExtensions);
  if (!content.content?.length) content.content = [{ type: "paragraph" }];
  return content as { type: "doc"; content: unknown[] };
}
