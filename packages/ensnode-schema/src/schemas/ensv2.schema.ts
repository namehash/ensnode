import { onchainEnum, onchainTable, primaryKey, relations } from "ponder";

// Registry<->Domain is 1:1
// Registry->Doimains is 1:many

/**
 * Polymorphism in this Drizzle v1 schema is acomplished with _Type and _Id columns. In the future,
 * when ponder supports it, we can/should move to Drizzle v2 conditional relations to support
 * polymorphism.
 *
 * In the future, when Ponder supports `check` constraints, we can include them for additional
 * guarantees.
 */

////////////
// Registry
////////////

export const registryType = onchainEnum("RegistryType", ["RegistryContract", "ImplicitRegistry"]);

export const registry = onchainTable(
  "registries",
  (t) => ({
    // If RegistryContract: CAIP-10 Account ID
    // If ImplicitRegistry: parentDomainNode
    id: t.text().primaryKey(),
    type: registryType().notNull(),

    chainId: t.integer(),
    address: t.hex(),
    parentDomainNode: t.hex(),
  }),
  (t) => ({
    // TODO: enforce that it is RegistryContract | ImplicitRegistry with associated property constraints
    // registryType: check(
    //   "registry_type_check",
    //   sql`
    //     (type = 'RegistryContract' AND
    //       ${t.chainId} IS NOT NULL AND
    //       ${t.address} IS NOT NULL AND
    //       ${t.parentDomainNode} IS NULL) OR
    //     (type = 'ImplicitRegistry' AND
    //       ${t.chainId} ISNULL AND
    //       ${t.address} ISNULL AND
    //       ${t.parentDomainNode} IS NOT NULL)
    //   `,
    // ),
  }),
);

export const relations_registry = relations(registry, ({ one, many }) => ({
  domain: one(domain, {
    relationName: "subregistry",
    fields: [registry.id],
    references: [domain.registryId],
  }),
  domains: many(domain, { relationName: "registry" }),
  permissions: one(permissions, {
    relationName: "permissions",
    fields: [registry.chainId, registry.address],
    references: [permissions.chainId, permissions.address],
  }),
}));

//////////
// Domain
//////////

export const domain = onchainTable(
  "domains",
  (t) => ({
    // belongs to registry
    registryId: t.text().notNull(),
    tokenId: t.bigint().notNull(),

    labelHash: t.hex().notNull(),
    label: t.text().notNull(),

    // may have one subregistry
    subregistryId: t.text(),

    _hasAttemptedLabelHeal: t.boolean().notNull().default(false),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.registryId, t.tokenId] }),
  }),
);

export const relations_domain = relations(domain, ({ one }) => ({
  registry: one(registry, {
    relationName: "registry",
    fields: [domain.registryId],
    references: [registry.id],
  }),
  subregistry: one(registry, {
    relationName: "subregistry",
    fields: [domain.subregistryId],
    references: [registry.id],
  }),
}));

///////////////
// Permissions
///////////////

export const permissions = onchainTable(
  "permissions",
  (t) => ({
    chainId: t.integer().notNull(),
    address: t.hex().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address] }),
  }),
);

export const relations_permissions = relations(permissions, ({ one, many }) => ({
  registry: one(registry),
}));

// export const namespaceEntry = onchainTable(
//   "namespace_entries",
//   (t) => ({}),
//   (t) => ({}),
// );
