import { defineCollection } from "astro:content";
import { z } from "astro/zod";
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
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        /** Collapse the global sidebar off-canvas on desktop; peek strip expands on hover. */
        sidebarDocked: z.boolean().optional(),
      }),
    }),
  }),
  examples,
};
