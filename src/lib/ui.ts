// Small presentation helpers shared by server and client components.

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const AVATAR_COLORS = ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-cyan-700"];

/** Stable color per user so the same person always looks the same. */
export function avatarColor(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function relativeTime(date: Date, now = new Date()) {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

/** First ~140 characters of plain text from TipTap JSON, for list previews. */
export function previewText(content: unknown, max = 140): string {
  const out: string[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== "object" || out.join(" ").length > max) return;
    const node = n as { text?: string; content?: unknown[] };
    if (typeof node.text === "string") out.push(node.text);
    node.content?.forEach(walk);
  };
  walk(content);
  const text = out.join(" ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}
