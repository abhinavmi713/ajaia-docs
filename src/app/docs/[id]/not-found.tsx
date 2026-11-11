import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Document not found</h1>
      <p className="text-slate-600">It doesn&apos;t exist, or it hasn&apos;t been shared with you.</p>
      <Link href="/" className="text-blue-600 hover:underline">Back to documents</Link>
    </main>
  );
}
