import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";
import { z } from "astro/zod";

/** Arbitrary JSON object (validated as a plain object tree, not a string). */
const jsonObjectSchema = z.record(z.string(), z.unknown());

const docsOmnigraphExampleNamespaceSchema = z.enum([
  ENSNamespaceIds.Mainnet,
  ENSNamespaceIds.SepoliaV2,
]);

export const OmnigraphExampleQuerySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  namespace: docsOmnigraphExampleNamespaceSchema,
  query: z.string(),
  variables: jsonObjectSchema,
  response: jsonObjectSchema.optional(),
  connection: z.string(),
  href: z.string().optional(),
});

export type OmnigraphExampleQuery = z.infer<typeof OmnigraphExampleQuerySchema>;
