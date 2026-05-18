import { builder } from "@/omnigraph-api/builder";
import { CanonicalNameRef } from "@/omnigraph-api/schema/canonical-name";
import { type Domain, DomainInterfaceRef } from "@/omnigraph-api/schema/domain";

////////////////////////////////
// DomainCanonical
////////////////////////////////
export const DomainCanonicalRef = builder.objectRef<Domain>("DomainCanonical");

DomainCanonicalRef.implement({
  description:
    "Canonicality metadata for a Domain, including its name, depth, path, and node (namehash).",
  fields: (t) => ({
    name: t.field({
      description: "The Canonical Name for this Domain, in multiple representations.",
      type: CanonicalNameRef,
      nullable: false,
      resolve: (domain) => domain,
    }),
    depth: t.field({
      description:
        "The depth of this Domain, i.e. the number of labels in this Domain's Canonical Name (e.g. 2 for `vitalik.eth`).",
      type: "Int",
      nullable: false,
      resolve: (domain) => {
        if (domain.canonicalDepth == null) {
          throw new Error(
            `Invariant(DomainCanonical.depth): canonical Domain '${domain.id}' is missing canonicalDepth.`,
          );
        }

        return domain.canonicalDepth;
      },
    }),
    path: t.field({
      description:
        "The Canonical Path from this Domain to the ENS Root, root→leaf inclusive of this Domain.",
      type: [DomainInterfaceRef],
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalPath) {
          throw new Error(
            `Invariant(DomainCanonical.path): canonical Domain '${domain.id}' is missing canonicalPath.`,
          );
        }

        return domain.canonicalPath;
      },
    }),
    node: t.field({
      description:
        "The namehash of this Domain's Canonical Name. Note that this is NOT a stable reference to this Domain; use `Domain.id`.",
      type: "Node",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalNode) {
          throw new Error(
            `Invariant(DomainCanonical.node): canonical Domain '${domain.id}' is missing canonicalNode.`,
          );
        }

        return domain.canonicalNode;
      },
    }),
  }),
});
