import { onchainEnum, onchainTable, primaryKey, relations } from "ponder";
import type { Address } from "viem";

import type {
  CanonicalId,
  ChainId,
  DomainId,
  InterpretedLabel,
  LabelHash,
  Node,
  RegistryId,
} from "@ensnode/ensnode-sdk";

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
  address: t.hex().primaryKey().$type<Address>(),
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
    // see RegistryId for guarantees
    id: t.text().primaryKey().$type<RegistryId>(),
    type: registryType().notNull(),

    chainId: t.integer().$type<ChainId>(),
    address: t.hex().$type<Address>(),
    parentDomainNode: t.hex().$type<Node>(),
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
    // see DomainId for guarantees
    id: t.text().primaryKey().$type<DomainId>(),

    // belongs to registry by (registryId)
    registryId: t.text().notNull().$type<RegistryId>(),

    // TODO: we could probably avoid storing this at all and compute it on-demand
    canonicalId: t.bigint().notNull().$type<CanonicalId>(),
    labelHash: t.hex().notNull().$type<LabelHash>(),

    ownerId: t.hex().$type<Address>(),

    // may have one subregistry by (id)
    subregistryId: t.text().$type<RegistryId>(),

    // may have one resolver by (chainId, address)
    resolverChainId: t.integer().$type<ChainId>(),
    resolverAddress: t.hex().$type<Address>(),
  }),
  (t) => ({
    //
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
  label: one(label, {
    relationName: "label",
    fields: [domain.labelHash],
    references: [label.labelHash],
  }),
}));

/////////////////
// Registrations
/////////////////

// TODO: derive from registries plugin

///////////////
// Permissions
///////////////

export const permissions = onchainTable(
  "permissions",
  (t) => ({
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
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
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
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
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    resource: t.bigint().notNull(),
    user: t.hex().notNull().$type<Address>(),

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

export const label = onchainTable("labels", (t) => ({
  labelHash: t.hex().primaryKey().$type<LabelHash>(),
  value: t.text().notNull().$type<InterpretedLabel>(),

  // internals
  hasAttemptedHeal: t.boolean().notNull().default(false),
}));

export const label_relations = relations(label, ({ many }) => ({
  domains: many(domain),
}));
