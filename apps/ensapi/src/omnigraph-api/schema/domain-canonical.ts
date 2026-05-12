import { builder } from "@/omnigraph-api/builder";
import { type Domain, DomainInterfaceRef } from "@/omnigraph-api/schema/domain";

////////////////////////////////
// DomainCanonical
////////////////////////////////
export const DomainCanonicalRef = builder.objectRef<Domain>("DomainCanonical");

DomainCanonicalRef.implement({
  description:
    "The materialized canonical-tree projection of a Canonical Domain — Canonical Name, " +
    "leaf-to-root canonical path (as DomainIds), and namehash.",
  fields: (t) => ({
    name: t.field({
      description: "The Canonical Name for this Domain.",
      type: "InterpretedName",
      nullable: false,
      resolve: (domain) => {
        if (!domain.canonicalName) {
          throw new Error(
            `Invariant(DomainCanonical.name): canonical Domain '${domain.id}' is missing canonicalName.`,
          );
        }
        return domain.canonicalName;
      },
    }),
    path: t.field({
      description:
        "The Canonical Path from this Domain to the ENS Root, leaf→root inclusive of this Domain. Returned as DomainIds.",
      type: [DomainInterfaceRef],
      nullable: false,
      resolve: async (domain, _args, context) => {
        const canonicalPath = await context.loaders.canonicalPath.load(domain.id);
        if (canonicalPath instanceof Error) throw canonicalPath;
        if (canonicalPath === null) {
          throw new Error(
            `Invariant(DomainCanonical.path): canonical Domain '${domain.id}' produced null canonical path.`,
          );
        }
        return canonicalPath;
      },
    }),
    node: t.field({
      description: "The namehash of this Domain's Canonical Name.",
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
