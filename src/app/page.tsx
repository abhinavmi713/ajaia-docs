import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { previewText } from "@/lib/ui";
import { AppHeader } from "@/components/AppHeader";
import { DocList } from "@/components/DocList";
import { NewDocButton } from "@/components/NewDocButton";
import { ImportButton } from "@/components/ImportButton";

export default async function Home() {
  const user = await requireUser();

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, content: true, _count: { select: { shares: true } } },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        content: true,
        owner: { select: { id: true, name: true } },
        shares: { where: { userId: user.id }, select: { role: true } },
      },
    }),
  ]);

  return (
    <>
      <AppHeader user={user} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user.name.split(" ")[0]}</h1>
            <p className="text-sm text-slate-500">Start a new document or import an existing file.</p>
          </div>
          <div className="flex items-start gap-3">
            <ImportButton />
            <NewDocButton />
          </div>
        </div>
        <DocList
          title="Owned by me"
          variant="owned"
          empty={
            <>
              <p className="font-medium text-slate-700">No documents yet</p>
              <p>Click “New document” or import a .txt, .md or .docx file.</p>
            </>
          }
          docs={owned.map((d) => ({
            id: d.id,
            title: d.title,
            updatedAt: d.updatedAt,
            preview: previewText(d.content),
            owner: { id: user.id, name: user.name },
            sharedCount: d._count.shares,
          }))}
        />
        <DocList
          title="Shared with me"
          variant="shared"
          empty={
            <>
              <p className="font-medium text-slate-700">Nothing shared with you yet</p>
              <p>When someone shares a document with you, it shows up here.</p>
            </>
          }
          docs={shared.map((d) => ({
            id: d.id,
            title: d.title,
            updatedAt: d.updatedAt,
            preview: previewText(d.content),
            owner: d.owner,
            role: d.shares[0]?.role === "viewer" ? "viewer" : "editor",
          }))}
        />
      </main>
    </>
  );
}
