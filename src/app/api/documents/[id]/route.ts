import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { handle, loadDocFor, requireApiUser } from "@/lib/http";
import { updateDocSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/documents/:id  { title?, content? }
// Content edits need "edit"; renaming needs "rename" (owner only).
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { id } = await params;
  const data = updateDocSchema.parse(await req.json().catch(() => null));
  await loadDocFor(id, user.id, data.title !== undefined ? "rename" : "edit");
  if (data.title !== undefined && data.content !== undefined) await loadDocFor(id, user.id, "edit");

  const doc = await prisma.document.update({
    where: { id },
    data: { title: data.title, content: data.content as Prisma.InputJsonValue | undefined },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(doc);
});

// DELETE /api/documents/:id  (owner only)
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { id } = await params;
  await loadDocFor(id, user.id, "delete");
  await prisma.document.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});
