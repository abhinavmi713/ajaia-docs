// Idempotent seed: safe to run on every deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SEED_USERS = [
  { email: "alice@demo.com", name: "Alice Anders" },
  { email: "bob@demo.com", name: "Bob Brown" },
  { email: "carol@demo.com", name: "Carol Chen" },
];

const welcomeContent = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to Ajaia Docs" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This document is owned by Alice and " },
        { type: "text", marks: [{ type: "bold" }], text: "shared with Bob" },
        { type: "text", text: ". Log in as Bob to see it under " },
        { type: "text", marks: [{ type: "italic" }], text: "Shared with me" },
        { type: "text", text: "." },
      ],
    },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Edits autosave" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Formatting is preserved" }] }] },
      ],
    },
  ],
};

async function main() {
  for (const u of SEED_USERS) {
    await prisma.user.upsert({ where: { email: u.email }, update: { name: u.name }, create: u });
  }

  const alice = await prisma.user.findUniqueOrThrow({ where: { email: "alice@demo.com" } });
  const bob = await prisma.user.findUniqueOrThrow({ where: { email: "bob@demo.com" } });

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome to Ajaia Docs" },
  });
  if (!existing) {
    await prisma.document.create({
      data: {
        title: "Welcome to Ajaia Docs",
        content: welcomeContent,
        ownerId: alice.id,
        shares: { create: { userId: bob.id, role: "editor" } },
      },
    });
  }
  console.log("Seed complete:", SEED_USERS.map((u) => u.email).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
