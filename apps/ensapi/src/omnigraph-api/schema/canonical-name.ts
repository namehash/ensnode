import { beautifyInterpretedName } from "enssdk";

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
        "The Canonical Name as an InterpretedName: each label is either a normalized literal Label or an Encoded LabelHash.",
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
    beautified: t.field({
      description:
        "The Canonical Name as a BeautifiedName: the InterpretedName with its normalized labels beautified per ENSIP-15 (https://docs.ens.domains/ensip/15) for display. Encoded LabelHash labels are preserved verbatim. Display-only; use `interpreted` for navigation targets and lookup keys.",
      type: "BeautifiedName",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalName) {
          throw new Error(
            `Invariant(CanonicalName.beautified): canonical Domain '${domain.id}' is missing canonicalName.`,
          );
        }

        return beautifyInterpretedName(domain.canonicalName);
      },
    }),
  }),
});
