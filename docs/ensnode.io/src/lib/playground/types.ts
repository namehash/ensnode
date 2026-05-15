import { z } from "astro/zod";

/** Arbitrary JSON object (validated as a plain object tree, not a string). */
const jsonObjectSchema = z.record(z.string(), z.unknown());

export const OmnigraphExampleQuerySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  query: z.string(),
  variables: jsonObjectSchema,
  response: jsonObjectSchema.optional(),
  connection: z.string(),
});

export type OmnigraphExampleQuery = z.infer<typeof OmnigraphExampleQuerySchema>;
