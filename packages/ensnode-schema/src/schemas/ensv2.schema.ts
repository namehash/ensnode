import { onchainEnum, onchainTable, primaryKey, relations, uniqueIndex } from "ponder";

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

///////////
// Account
///////////

export const account = onchainTable("accounts", (t) => ({
  address: t.hex().primaryKey(),
}));

export const account_relations = relations(account, ({ many }) => ({
  // registrations,
  // dedicatedResolvers,
  domains: many(domain),
  permissions: many(permissionsUser),
}));

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

    ownerId: t.hex(),

    // may have one subregistry by (id)
    subregistryId: t.text(),

    // may have one resolver by (chainId, address)
    resolverChainId: t.integer(),
    resolverAddress: t.hex(),
  }),
  (t) => ({
    // unique by (registryId, canonicalId)
    pk: primaryKey({ columns: [t.registryId, t.canonicalId] }),
  }),
);

export const relations_domain = relations(domain, ({ one }) => ({
  owner: one(account, {
    relationName: "owner",
    fields: [domain.ownerId],
    references: [account.address],
  }),
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
  label: one(labelInNamespace, {
    relationName: "label",
    fields: [domain.labelHash],
    references: [labelInNamespace.labelHash],
  }),
  name: one(nameInNamespace),
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
  account: one(account, {
    fields: [permissionsUser.user],
    references: [account.address],
  }),
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

//////////
// Labels
//////////

export const labelInNamespace = onchainTable("labels_in_namespace", (t) => ({
  labelHash: t.hex().primaryKey(),
  value: t.text().notNull(),

  // internals
  hasAttemptedHeal: t.boolean().notNull().default(false),
}));

export const labelInNamespace_relations = relations(labelInNamespace, ({ many }) => ({
  domains: many(domain),
}));

/////////
// Names
/////////

export const nameInNamespace = onchainTable(
  "names_in_namespace",
  (t) => ({
    node: t.hex().primaryKey(),
    fqdn: t.text().notNull(),

    domainRegistryId: t.text().notNull(),
    domainCanonicalId: t.bigint().notNull(),
  }),
  (t) => ({
    byFqdn: uniqueIndex().on(t.fqdn),
  }),
);

export const nameInNamespace_relations = relations(nameInNamespace, ({ one }) => ({
  domain: one(domain, {
    relationName: "name",
    fields: [nameInNamespace.domainRegistryId, nameInNamespace.domainCanonicalId],
    references: [domain.registryId, domain.canonicalId],
  }),
}));
