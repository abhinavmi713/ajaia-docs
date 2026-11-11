import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
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
      select: { id: true, title: true, updatedAt: true, _count: { select: { shares: true } } },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, owner: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <AppHeader user={user} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
          <div className="flex items-start gap-3">
            <ImportButton />
            <NewDocButton />
          </div>
        </div>
        <DocList
          title="Owned by me"
          variant="owned"
          empty="You don't own any documents yet. Create one to get started."
          docs={owned.map((d) => ({ ...d, ownerName: user.name, sharedCount: d._count.shares }))}
        />
        <DocList
          title="Shared with me"
          variant="shared"
          empty="Nothing has been shared with you yet."
          docs={shared.map((d) => ({ ...d, ownerName: d.owner.name }))}
        />
      </main>
    </>
  );
}
