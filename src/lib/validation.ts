import { z } from "zod";

export const MAX_CONTENT_BYTES = 1_000_000; // 1 MB of editor JSON

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or fewer");

// We only check the shape of the root node; TipTap/ProseMirror owns the inner schema.
export const contentSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.any()).optional() })
  .passthrough()
  .refine((c) => JSON.stringify(c).length <= MAX_CONTENT_BYTES, "Document is too large (max 1 MB)");

export const updateDocSchema = z
  .object({ title: titleSchema.optional(), content: contentSchema.optional() })
  .refine((d) => d.title !== undefined || d.content !== undefined, "Nothing to update");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };
