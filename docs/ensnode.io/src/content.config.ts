import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

import { exampleQuerySchema, savedQueries } from "./data/ens-v1-examples-queries";

function unwrapDefault(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: z.ZodTypeAny = schema;
  while (current instanceof z.ZodDefault) {
    current = current._def.innerType;
  }
  return current;
}

const examples = defineCollection({
  loader: () =>
    savedQueries.map((query) => ({
      ...query,
      id: query.id,
    })),
  schema: exampleQuerySchema,
});

const starlightDocsSchema = docsSchema();

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: (context) => {
      const base = starlightDocsSchema(context);
      const sidebarSchema = unwrapDefault(base.shape.sidebar);
      if (!(sidebarSchema instanceof z.ZodObject)) {
        throw new Error("Unexpected Starlight docs schema: sidebar is not a ZodObject");
      }

      return base.extend({
        sidebar: sidebarSchema
          .extend({
            /** Collapse the global sidebar off-canvas on desktop; peek strip expands on hover. */
            docked: z.boolean().optional(),
          })
          .default({}),
      });
    },
  }),
  examples,
};
