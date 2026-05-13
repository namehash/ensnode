import { z } from "astro:content";
import { ENSNamespaceIds } from "@ensnode/ensnode-sdk";

/** Pretty-print JSON for Starlight `Code` blocks and ENSAdmin query params. */
export function stringifyJsonForDocs(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Sepolia v2 namespace — matches the public v2 Sepolia ENSNode URL in docs playgrounds. */
export const DOCS_OMNIGRAPH_NAMESPACE = ENSNamespaceIds.SepoliaV2;

/** Arbitrary JSON object (validated as a plain object tree, not a string). */
const jsonObjectSchema = z.record(z.string(), z.unknown());

export const omnigraphExampleQuerySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  query: z.string(),
  variables: jsonObjectSchema,
  response: jsonObjectSchema.optional(),
  connection: z.string(),
});

export type OmnigraphExampleQuery = z.infer<typeof omnigraphExampleQuerySchema>;
