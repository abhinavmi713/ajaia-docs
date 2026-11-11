import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";
import { Avatar } from "./Avatar";

async function logout() {
  "use server";
  await destroySession();
  redirect("/login");
}

export function AppHeader({ user }: { user: { id: string; name: string; email: string } }) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="inline-block w-6 h-7 rounded-sm bg-blue-600" aria-hidden />
          Ajaia Docs
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-2 text-slate-700">
            <Avatar name={user.name} id={user.id} size="sm" />
            <span className="hidden sm:inline">{user.name}</span>
            <span className="text-slate-400 hidden md:inline">{user.email}</span>
          </span>
          <form action={logout}>
            <button className="text-slate-600 hover:text-slate-900 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
