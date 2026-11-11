import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, getCurrentUser } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const userId = String(formData.get("userId") ?? "");
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  if (!user) redirect("/login?error=1");
  await createSession(user.id);
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error } = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { email: "asc" } });

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form action={login} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Ajaia Docs</h1>
        <p className="text-sm text-slate-600">
          Demo login: pick a seeded user. Authentication is mocked (no passwords) but the session
          is a signed server-side cookie.
        </p>
        {error && <p className="text-sm text-red-600">Please choose a valid user.</p>}
        <label className="block text-sm font-medium text-slate-700">
          Sign in as
          <select
            name="userId"
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>
        <button className="w-full rounded-md bg-blue-600 text-white py-2 font-medium hover:bg-blue-700">
          Sign in
        </button>
      </form>
    </main>
  );
}
