import { builder } from "@/omnigraph-api/builder";
import type { Domain } from "@/omnigraph-api/schema/domain";

////////////////////////////////
// CanonicalName
////////////////////////////////
export const CanonicalNameRef = builder.objectRef<Domain>("CanonicalName");

CanonicalNameRef.implement({
  description: "A Canonical Name, exposed in each representation we support.",
  fields: (t) => ({
    interpreted: t.field({
      description:
        "The Canonical Name as an InterpretedName: each label is either a normalized literal Label or an Encoded LabelHash. Suitable for navigation, lookup, and as a stable identifier.",
      type: "InterpretedName",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalName) {
          throw new Error(
            `Invariant(CanonicalName.interpreted): canonical Domain '${domain.id}' is missing canonicalName.`,
          );
        }
        return domain.canonicalName;
      },
    }),
  }),
});
