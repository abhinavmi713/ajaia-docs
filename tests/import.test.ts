import { describe, expect, it } from "vitest";
import { ImportError, fileToDocContent, textToHtml, titleFromFilename } from "@/lib/import";

const buf = (s: string) => Buffer.from(s, "utf8");
const types = (doc: { content: unknown[] }) => (doc.content as { type: string }[]).map((n) => n.type);
const json = (x: unknown) => JSON.stringify(x);

describe("file import", () => {
  it("turns .txt blank-line blocks into paragraphs and escapes HTML", async () => {
    const doc = await fileToDocContent("notes.txt", buf("First para\nsame para\n\n<script>alert(1)</script>"));
    expect(types(doc)).toEqual(["paragraph", "paragraph"]);
    expect(json(doc)).toContain("hardBreak");
    expect(json(doc)).toContain("<script>alert(1)</script>"); // kept as literal text, not markup
  });

  it("maps Markdown headings, marks and lists onto the editor schema", async () => {
    const md = "# Title\n\n## Sub\n\nSome **bold** and *italic*.\n\n- a\n- b\n\n1. one\n2. two\n";
    const doc = await fileToDocContent("readme.md", buf(md));
    expect(types(doc)).toEqual(["heading", "heading", "paragraph", "bulletList", "orderedList"]);
    expect(json(doc)).toContain('"level":1');
    expect(json(doc)).toContain('"type":"bold"');
    expect(json(doc)).toContain('"type":"italic"');
  });

  it("drops raw HTML that is not part of the schema (e.g. scripts in Markdown)", async () => {
    const doc = await fileToDocContent("x.md", buf("Hello\n\n<script>alert('x')</script>\n\n<iframe src=x></iframe>"));
    expect(json(doc)).not.toContain("alert");
    expect(json(doc)).not.toContain("iframe");
  });

  it("rejects unsupported, empty and oversized files with a clear message", async () => {
    await expect(fileToDocContent("photo.png", buf("x"))).rejects.toThrow(/Unsupported file type/);
    await expect(fileToDocContent("empty.txt", Buffer.alloc(0))).rejects.toThrow(ImportError);
    await expect(fileToDocContent("big.txt", Buffer.alloc(2 * 1024 * 1024 + 1, 97))).rejects.toThrow(/too large/);
    await expect(fileToDocContent("fake.docx", buf("not a zip"))).rejects.toThrow(/valid Word document/);
  });

  it("derives a title from the filename", () => {
    expect(titleFromFilename("Q3 plan.final.md")).toBe("Q3 plan.final");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });

  it("textToHtml normalises Windows line endings", () => {
    expect(textToHtml("a\r\n\r\nb")).toBe("<p>a</p><p>b</p>");
  });
});

describe(".docx import (real Word file via mammoth)", () => {
  it("preserves heading, bold/italic/underline and bullet list", async () => {
    const { readFileSync } = await import("node:fs");
    const doc = await fileToDocContent("Quarterly Plan.docx", readFileSync("tests/fixtures/sample.docx"));
    expect(types(doc)).toEqual(["heading", "paragraph", "bulletList"]);
    for (const mark of ["bold", "italic", "underline"]) expect(json(doc)).toContain(`"type":"${mark}"`);
    expect(json(doc)).toContain("Ship the editor");
  });
});
