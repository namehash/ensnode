import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { savedQueries, savedQuerySchema } from "./data/savedQueries";

const examples = defineCollection({
  loader: () =>
    savedQueries.map((query) => ({
      ...query,
      id: query.id,
    })),
  schema: savedQuerySchema,
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  examples,
};
