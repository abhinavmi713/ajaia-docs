import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError, handle, requireApiUser } from "@/lib/http";
import { ImportError, MAX_UPLOAD_BYTES, fileToDocContent, titleFromFilename } from "@/lib/import";

// POST /api/import  (multipart/form-data, field "file") -> creates a new document owned by the caller
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "File is too large (max 2 MB)");

  let content;
  try {
    content = await fileToDocContent(file.name, Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    if (e instanceof ImportError) throw new HttpError(400, e.message);
    throw e;
  }

  const doc = await prisma.document.create({
    data: { title: titleFromFilename(file.name), content: content as Prisma.InputJsonValue, ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(doc, { status: 201 });
});
