import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { savedQueries } from "./data/savedQueries";

const examples = defineCollection({
  loader: () =>
    savedQueries.map((query) => ({
      ...query,
      id: query.id,
    })),
  schema: z.object({
    operationName: z.string(),
    id: z.string(),
    name: z.string(),
    category: z.string(),
    description: z.string(),
    query: z.string(),
    variables: z.string(),
  }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  examples,
};
