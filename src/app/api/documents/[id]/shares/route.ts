import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, handle, loadDocFor, requireApiUser } from "@/lib/http";
import { shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/documents/:id/shares  { email, role? }  (owner only)
// Adds a collaborator, or changes the role of an existing one (upsert).
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { id } = await params;
  const { email, role } = shareSchema.parse(await req.json().catch(() => null));
  const doc = await loadDocFor(id, user.id, "share");

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) throw new HttpError(404, `No user with email ${email}`);
  if (target.id === doc.ownerId) throw new HttpError(400, "You already own this document");

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { role },
    create: { documentId: id, userId: target.id, role },
  });
  return NextResponse.json(
    { user: { id: target.id, name: target.name, email: target.email, role } },
    { status: 201 },
  );
});

// DELETE /api/documents/:id/shares?userId=...  (owner only) — revoke access
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { id } = await params;
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) throw new HttpError(400, "userId is required");
  await loadDocFor(id, user.id, "share");
  await prisma.documentShare.deleteMany({ where: { documentId: id, userId } });
  return new NextResponse(null, { status: 204 });
});
