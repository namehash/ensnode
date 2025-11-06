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
    //
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
    // belongs to registry by (registryId)
    registryId: t.text().notNull(),
    canonicalId: t.bigint().notNull(),

    labelHash: t.hex().notNull(),
    label: t.text().notNull(),

    // may have one subregistry by (id)
    subregistryId: t.text(),

    // may have one resolver by (chainId, address)
    resolverChainId: t.integer(),
    resolverAddress: t.hex(),

    // internals
    _hasAttemptedLabelHeal: t.boolean().notNull().default(false),
  }),
  (t) => ({
    // unique by (registryId, canonicalId)
    pk: primaryKey({ columns: [t.registryId, t.canonicalId] }),
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
  resources: many(permissionsResource),
  users: many(permissionsUser),
}));

export const permissionsResource = onchainTable(
  "permissions_resources",
  (t) => ({
    chainId: t.integer().notNull(),
    address: t.hex().notNull(),
    resource: t.bigint().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address, t.resource] }),
  }),
);

export const relations_permissionsResource = relations(permissionsResource, ({ one, many }) => ({
  permissions: one(permissions, {
    fields: [permissionsResource.chainId, permissionsResource.address],
    references: [permissions.chainId, permissions.address],
  }),
}));

export const permissionsUser = onchainTable(
  "permissions_users",
  (t) => ({
    chainId: t.integer().notNull(),
    address: t.hex().notNull(),
    resource: t.bigint().notNull(),
    user: t.hex().notNull(),

    // has one roles bitmap
    // TODO: can materialize into more semantic (polymorphic) interpretation of roles based on source
    // contract, but not now
    roles: t.bigint().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address, t.resource, t.user] }),
  }),
);

export const relations_permissionsUser = relations(permissionsUser, ({ one, many }) => ({
  permissions: one(permissions, {
    fields: [permissionsUser.chainId, permissionsUser.address],
    references: [permissions.chainId, permissions.address],
  }),
  resource: one(permissionsResource, {
    fields: [permissionsUser.chainId, permissionsUser.address, permissionsUser.resource],
    references: [
      permissionsResource.chainId,
      permissionsResource.address,
      permissionsResource.resource,
    ],
  }),
}));

// TODO: Permissions USer — should it just be Account?

// export const namespaceEntry = onchainTable(
//   "namespace_entries",
//   (t) => ({}),
//   (t) => ({}),
// );
