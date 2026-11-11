import Link from "next/link";
import { Avatar } from "./Avatar";
import { relativeTime } from "@/lib/ui";

export interface DocListItem {
  id: string;
  title: string;
  updatedAt: Date;
  preview: string;
  owner: { id: string; name: string };
  sharedCount?: number;
  role?: "editor" | "viewer";
}

export function DocList({
  title,
  docs,
  empty,
  variant,
}: {
  title: string;
  docs: DocListItem[];
  empty: React.ReactNode;
  variant: "owned" | "shared";
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title} <span className="text-slate-400 font-normal">({docs.length})</span>
      </h2>
      {docs.length === 0 ? (
        <div className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          {empty}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/docs/${d.id}`}
                className="group flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition"
              >
                {/* Mini page preview */}
                <div className="h-28 bg-slate-50 border-b border-slate-100 px-5 pt-4 overflow-hidden">
                  <div className="bg-white h-full rounded-t shadow-sm px-3 pt-2 text-[10px] leading-snug text-slate-500 line-clamp-5">
                    {d.preview || <span className="italic text-slate-300">Empty document</span>}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <span className="font-medium text-slate-900 truncate group-hover:text-blue-700">{d.title}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Avatar name={d.owner.name} id={d.owner.id} size="sm" />
                    <span className="truncate flex-1">
                      {variant === "owned" ? "You" : d.owner.name} · {relativeTime(d.updatedAt)}
                    </span>
                    {variant === "owned" ? (
                      d.sharedCount ? (
                        <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 shrink-0">
                          Shared · {d.sharedCount}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 shrink-0">Private</span>
                      )
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 shrink-0 ${
                          d.role === "viewer" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {d.role === "viewer" ? "Can view" : "Can edit"}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
