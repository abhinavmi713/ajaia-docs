import { describe, expect, it } from "vitest";
import { shareSchema } from "@/lib/validation";
import { initials, previewText, relativeTime } from "@/lib/ui";

describe("shareSchema (role-based sharing)", () => {
  it("defaults to editor and normalises email", () => {
    expect(shareSchema.parse({ email: "  Bob@Demo.com " })).toEqual({ email: "bob@demo.com", role: "editor" });
  });
  it("accepts viewer", () => {
    expect(shareSchema.parse({ email: "bob@demo.com", role: "viewer" }).role).toBe("viewer");
  });
  it("rejects unknown roles (e.g. trying to grant owner)", () => {
    expect(() => shareSchema.parse({ email: "bob@demo.com", role: "owner" })).toThrow(/editor or viewer/);
  });
});

describe("ui helpers", () => {
  it("initials", () => {
    expect(initials("Alice Anders")).toBe("AA");
    expect(initials("cher")).toBe("C");
  });
  it("relativeTime", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    expect(relativeTime(new Date("2026-01-10T11:59:50Z"), now)).toBe("just now");
    expect(relativeTime(new Date("2026-01-10T11:55:00Z"), now)).toBe("5 min ago");
    expect(relativeTime(new Date("2026-01-09T12:00:00Z"), now)).toBe("1 day ago");
  });
  it("previewText flattens TipTap JSON and truncates", () => {
    const doc = { type: "doc", content: [{ type: "heading", content: [{ type: "text", text: "Hi" }] }, { type: "paragraph", content: [{ type: "text", text: "there" }] }] };
    expect(previewText(doc)).toBe("Hi there");
    expect(previewText({ type: "doc", content: [{ type: "text", text: "x".repeat(300) }] }, 10)).toBe("xxxxxxxxxx…");
  });
});
