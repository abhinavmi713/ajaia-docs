import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export function AppHeader({ user }: { user: { name: string; email: string } }) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="inline-block w-6 h-7 rounded-sm bg-blue-600" aria-hidden />
          Ajaia Docs
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 hidden sm:inline">
            {user.name} <span className="text-slate-400">({user.email})</span>
          </span>
          <form action={logout}>
            <button className="text-slate-600 hover:text-slate-900 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
