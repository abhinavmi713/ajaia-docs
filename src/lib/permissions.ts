// Pure access-control rules. No I/O, so they are trivially unit-testable and
// every API route / page funnels through the same decision.

export type Action = "read" | "edit" | "rename" | "share" | "delete";
export type Role = "owner" | "editor" | "viewer";

export interface DocAccessInfo {
  ownerId: string;
  shares: { userId: string; role: string }[];
}

const ALLOWED: Record<Role, Action[]> = {
  owner: ["read", "edit", "rename", "share", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
};

/** The user's role on a document, or null if they have no access at all. */
export function getRole(userId: string, doc: DocAccessInfo): Role | null {
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return null;
  return share.role === "viewer" ? "viewer" : "editor";
}

export function can(userId: string, doc: DocAccessInfo, action: Action): boolean {
  const role = getRole(userId, doc);
  return role !== null && ALLOWED[role].includes(action);
}

/**
 * HTTP status for a denied request:
 *  - 404 when the user has no access at all (don't reveal the document exists)
 *  - 403 when they can see it but may not perform this action
 *  - null when allowed
 */
export function denialStatus(userId: string, doc: DocAccessInfo | null, action: Action): 404 | 403 | null {
  if (!doc) return 404;
  const role = getRole(userId, doc);
  if (!role) return 404;
  return ALLOWED[role].includes(action) ? null : 403;
}
