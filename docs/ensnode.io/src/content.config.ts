import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { exampleQuerySchema, savedQueries } from "./data/savedQueries";

const examples = defineCollection({
  loader: () =>
    savedQueries.map((query) => ({
      ...query,
      id: query.id,
    })),
  schema: exampleQuerySchema,
});

const mintlifyDocs = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "../.mintlify/docs" }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    sidebarTitle: z.string().optional(),
  }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  examples,
  "mintlify-docs": mintlifyDocs,
};
