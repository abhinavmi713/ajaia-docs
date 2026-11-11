import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";
import { denialStatus, type Action } from "./permissions";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wraps a route handler so thrown HttpError / ZodError become clean JSON responses. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => i.message).join("; ");
        return NextResponse.json({ error: msg || "Invalid request" }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not signed in");
  return user;
}

/** Load a document and enforce the permission for `action`, throwing 404/403. */
export async function loadDocFor(docId: string, userId: string, action: Action) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { shares: { include: { user: true } }, owner: true },
  });
  const status = denialStatus(userId, doc, action);
  if (status === 404) throw new HttpError(404, "Document not found");
  if (status === 403)
    throw new HttpError(403, action === "edit" ? "You have view-only access to this document" : "Only the owner can do that");
  return doc!;
}
