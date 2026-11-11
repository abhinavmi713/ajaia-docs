import { avatarColor, initials } from "@/lib/ui";

export function Avatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-12 h-12 text-base" }[size];
  return (
    <span
      title={name}
      aria-hidden
      className={`${dims} ${avatarColor(id)} inline-flex items-center justify-center rounded-full text-white font-semibold ring-2 ring-white shrink-0`}
    >
      {initials(name)}
    </span>
  );
}
