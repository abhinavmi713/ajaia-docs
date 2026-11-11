import { describe, expect, it } from "vitest";
import { can, denialStatus, getRole, type DocAccessInfo } from "@/lib/permissions";

const doc: DocAccessInfo = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "editor" },
    { userId: "vic", role: "viewer" },
  ],
};

describe("getRole", () => {
  it("identifies owner, editor, viewer and strangers", () => {
    expect(getRole("alice", doc)).toBe("owner");
    expect(getRole("bob", doc)).toBe("editor");
    expect(getRole("vic", doc)).toBe("viewer");
    expect(getRole("carol", doc)).toBeNull();
  });

  it("treats unknown share roles as editor (the default granted role)", () => {
    expect(getRole("x", { ownerId: "a", shares: [{ userId: "x", role: "weird" }] })).toBe("editor");
  });
});

describe("can", () => {
  it("owner can do everything", () => {
    for (const a of ["read", "edit", "rename", "share", "delete"] as const) {
      expect(can("alice", doc, a)).toBe(true);
    }
  });

  it("shared editor can read and edit but not rename, share or delete", () => {
    expect(can("bob", doc, "read")).toBe(true);
    expect(can("bob", doc, "edit")).toBe(true);
    expect(can("bob", doc, "rename")).toBe(false);
    expect(can("bob", doc, "share")).toBe(false);
    expect(can("bob", doc, "delete")).toBe(false);
  });

  it("viewer can only read", () => {
    expect(can("vic", doc, "read")).toBe(true);
    expect(can("vic", doc, "edit")).toBe(false);
  });

  it("a user with no share has no access at all", () => {
    expect(can("carol", doc, "read")).toBe(false);
  });
});

describe("denialStatus (maps to HTTP)", () => {
  it("returns 404 for missing documents and for strangers (no existence leak)", () => {
    expect(denialStatus("alice", null, "read")).toBe(404);
    expect(denialStatus("carol", doc, "read")).toBe(404);
    expect(denialStatus("carol", doc, "delete")).toBe(404);
  });

  it("returns 403 when a collaborator attempts an owner-only action", () => {
    expect(denialStatus("bob", doc, "rename")).toBe(403);
    expect(denialStatus("bob", doc, "share")).toBe(403);
    expect(denialStatus("vic", doc, "edit")).toBe(403);
  });

  it("returns null when allowed", () => {
    expect(denialStatus("bob", doc, "edit")).toBeNull();
    expect(denialStatus("alice", doc, "share")).toBeNull();
  });
});
