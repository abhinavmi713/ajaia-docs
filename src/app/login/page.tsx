import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";

// What each seeded user is good for when reviewing.
const HINTS: Record<string, string> = {
  "alice@demo.com": "Owns the welcome doc · try creating, sharing, importing",
  "bob@demo.com": "Has the welcome doc shared with him (can edit)",
  "carol@demo.com": "Starts with nothing · use her to test access denied",
};

async function login(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { email: "asc" } });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-11 rounded-md bg-blue-600 shadow-sm relative" aria-hidden>
            <span className="absolute left-2 right-2 top-3 h-0.5 bg-white/80 rounded" />
            <span className="absolute left-2 right-2 top-5 h-0.5 bg-white/80 rounded" />
            <span className="absolute left-2 right-4 top-7 h-0.5 bg-white/80 rounded" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ajaia Docs</h1>
            <p className="text-sm text-slate-500">Write, format and share documents with your team.</p>
          </div>
        </div>

        <form action={login} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          <h2 className="font-medium text-slate-900">Choose a demo account</h2>
          {error && <p className="text-sm text-red-600">Please choose a valid user.</p>}
          {users.map((u) => (
            <button
              key={u.id}
              name="userId"
              value={u.id}
              className="w-full flex items-center gap-3 text-left rounded-xl border border-slate-200 px-3 py-3 hover:border-blue-400 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Avatar name={u.name} id={u.id} />
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-slate-900">{u.name}</span>
                <span className="block text-xs text-slate-500 truncate">{HINTS[u.email] ?? u.email}</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">{u.email}</span>
              <span className="text-slate-300" aria-hidden>→</span>
            </button>
          ))}
          <p className="text-xs text-slate-500 pt-1">
            Demo login: authentication is mocked (no passwords), but the session is a signed, httpOnly server cookie.
            Open a private window to be two users at once.
          </p>
        </form>
      </div>
    </main>
  );
}
