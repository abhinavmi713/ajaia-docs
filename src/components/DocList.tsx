import Link from "next/link";

export interface DocListItem {
  id: string;
  title: string;
  updatedAt: Date;
  ownerName: string;
  sharedCount?: number;
}

const fmt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function DocList({
  title,
  docs,
  empty,
  variant,
}: {
  title: string;
  docs: DocListItem[];
  empty: string;
  variant: "owned" | "shared";
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title} <span className="text-slate-400">({docs.length})</span>
      </h2>
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg p-6 text-center">
          {empty}
        </p>
      ) : (
        <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/docs/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="w-5 h-6 rounded-sm bg-blue-100 border border-blue-300 shrink-0" aria-hidden />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-slate-900 truncate">{d.title}</span>
                  <span className="block text-xs text-slate-500">
                    {variant === "shared" ? `Owned by ${d.ownerName}` : "Owned by you"}
                    {variant === "owned" && d.sharedCount ? ` · Shared with ${d.sharedCount}` : ""}
                  </span>
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    variant === "owned" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {variant === "owned" ? "Owner" : "Shared"}
                </span>
                <span className="text-xs text-slate-400 w-36 text-right hidden sm:block">
                  {fmt.format(d.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
