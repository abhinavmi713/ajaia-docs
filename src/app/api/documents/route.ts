import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle, requireApiUser } from "@/lib/http";
import { EMPTY_DOC, titleSchema } from "@/lib/validation";

// POST /api/documents  { title? }  -> create an empty document owned by the caller
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const body = await req.json().catch(() => ({}));
  const title = body?.title ? titleSchema.parse(body.title) : "Untitled document";
  const doc = await prisma.document.create({
    data: { title, content: EMPTY_DOC, ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(doc, { status: 201 });
});
