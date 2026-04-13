import type { ensIndexerSchema } from "@/lib/ensdb/singleton";
import { builder } from "@/omnigraph-api/builder";

export const LabelRef = builder.objectRef<typeof ensIndexerSchema.label.$inferSelect>("Label");
LabelRef.implement({
  description: "Represents a Label within ENS, providing its hash and interpreted representation.",
  fields: (t) => ({
    //////////////
    // Label.hash
    //////////////
    hash: t.field({
      description:
        "The Label's LabelHash\n(@see https://ensnode.io/docs/reference/terminology#labels-labelhashes-labelhash-function)",
      type: "Hex",
      nullable: false,
      resolve: (parent) => parent.labelHash,
    }),

    /////////////////////
    // Label.interpreted
    /////////////////////
    interpreted: t.field({
      description:
        "The Label represented as an Interpreted Label. This is either a normalized Literal Label or an Encoded LabelHash. \n(@see https://ensnode.io/docs/reference/terminology#interpreted-label)",
      type: "InterpretedLabel",
      nullable: false,
      resolve: (parent) => parent.interpreted,
    }),
  }),
});
