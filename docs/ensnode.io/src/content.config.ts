import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { exampleQuerySchema, savedQueries } from "./data/ens-v1-examples-queries";

const examples = defineCollection({
  loader: () =>
    savedQueries.map((query) => ({
      ...query,
      id: query.id,
    })),
  schema: exampleQuerySchema,
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  examples,
};
