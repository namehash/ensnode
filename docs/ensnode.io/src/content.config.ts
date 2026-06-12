import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { topicSchema } from "starlight-sidebar-topics/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: topicSchema.extend({
        /** Collapse the global sidebar off-canvas on desktop; peek strip expands on hover. */
        sidebarDocked: z.boolean().optional(),
      }),
    }),
  }),
};
