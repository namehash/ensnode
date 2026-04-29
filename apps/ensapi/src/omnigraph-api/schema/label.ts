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

//////////
// Inputs
//////////

/**
 * Maximum number of LabelHashes accepted per `Query.labels` request.
 *
 * Caps the resolver's `inArray` query so a single GraphQL request cannot enumerate
 * the entire `label` table.
 */
export const LABELS_BY_HASHES_MAX = 200;

export const LabelsByHashesInput = builder.inputType("LabelsByHashesInput", {
  description: "Look up Labels by a batch of LabelHashes.",
  fields: (t) => ({
    hashes: t.field({
      type: ["Hex"],
      required: true,
      description: `LabelHashes to look up. Up to ${LABELS_BY_HASHES_MAX} hashes per request. Absent labels are simply omitted from the result.`,
    }),
  }),
});
