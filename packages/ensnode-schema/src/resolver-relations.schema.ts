/**
 * Schema Definitions for an extension of the subgraph schema to track Domain<->Resolver
 * connections by chainId. The subgraph never expected to track Resolvers across multiple chains,
 * but since we now index multiple chains, it becomes necessary to store the information encoding
 * "to which Resolver on a specific chain does this Domain delegate".
 */

import { onchainTable, relations, uniqueIndex } from "ponder";
import { domain, resolver } from "./subgraph.schema";

// add the additional relationships to subgraph's Domain entity
export const ext_domainRelations = relations(domain, ({ one, many }) => ({
  // domain has many resolver relations
  resolverRelations: many(ext_domainResolverRelation),
}));

// add the additional relationships to subgraph's Resolver entity
export const ext_resolverRelations = relations(resolver, ({ one, many }) => ({
  // resolver has many domain relations
  domainRelations: many(ext_domainResolverRelation),
}));

// tracks which domains delegate to which resolvers on which chains
export const ext_domainResolverRelation = onchainTable(
  "ext_domain_resolver_relations",
  (t) => ({
    // keyed by (chainId, domainId, resolverId)
    id: t.text().primaryKey(),
    chainId: t.integer().notNull(),
    domainId: t.text().notNull(),
    resolverId: t.text().notNull(),
  }),
  (t) => ({
    uniqueBy: uniqueIndex().on(t.chainId, t.resolverId, t.domainId),
  }),
);

export const ext_domainResolverRelationsRelations = relations(
  ext_domainResolverRelation,
  ({ one, many }) => ({
    // belongs to domain
    domain: one(domain, {
      fields: [ext_domainResolverRelation.domainId],
      references: [domain.id],
    }),
    // belongs to resolver
    resolver: one(resolver, {
      fields: [ext_domainResolverRelation.resolverId],
      references: [resolver.id],
    }),
  }),
);
