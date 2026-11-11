import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getRole } from "@/lib/permissions";
import { DocEditor } from "@/components/DocEditor";

type Props = { params: Promise<{ id: string }> };

async function loadForPage(id: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { owner: true, shares: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  const role = doc ? getRole(userId, doc) : null;
  // No access => 404, so we don't reveal that the document exists.
  if (!doc || !role) notFound();
  return { doc, role };
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, select: { title: true } });
  return { title: doc ? `${doc.title} · Ajaia Docs` : "Ajaia Docs" };
}

export default async function DocPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const { doc, role } = await loadForPage(id, user.id);
  const person = (u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email });

  return (
    <DocEditor
      id={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content as JSONContent}
      role={role}
      owner={person(doc.owner)}
      sharedWith={doc.shares.map((s) => ({ ...person(s.user), role: s.role === "viewer" ? ("viewer" as const) : ("editor" as const) }))}
    />
  );
}
