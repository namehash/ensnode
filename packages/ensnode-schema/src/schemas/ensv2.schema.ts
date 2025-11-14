import { onchainEnum, onchainTable, relations, uniqueIndex } from "ponder";
import type { Address } from "viem";

import type {
  ChainId,
  DomainId,
  EncodedReferrer,
  InterpretedLabel,
  LabelHash,
  Node,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  ResolverId,
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
  id: t.hex().primaryKey().$type<Address>(),
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

    // has contract AccountId (RegistryContract)
    chainId: t.integer().$type<ChainId>(),
    address: t.hex().$type<Address>(),
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

    // belongs to registry
    registryId: t.text().notNull().$type<RegistryId>(),
    labelHash: t.hex().notNull().$type<LabelHash>(),

    // may have an owner
    ownerId: t.hex().$type<Address>(),

    // may have one subregistry
    subregistryId: t.text().$type<RegistryId>(),

    // may have one resolver
    resolverId: t.text().$type<ResolverId>(),
  }),
  (t) => ({
    //
  }),
);

export const relations_domain = relations(domain, ({ one, many }) => ({
  owner: one(account, {
    relationName: "owner",
    fields: [domain.ownerId],
    references: [account.id],
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
  registrations: many(registration),
}));

/////////////////
// Registrations
/////////////////

export const registrationType = onchainEnum("RegistrationType", [
  "NameWrapper",
  "BaseRegistrar",
  "ThreeDNS",
]);

export const registration = onchainTable(
  "registrations",
  (t) => ({
    // keyed by (domainId, index)
    id: t.text().primaryKey().$type<RegistrationId>(),
    type: registrationType().notNull(),

    domainId: t.text().notNull().$type<DomainId>(),
    index: t.integer().notNull().default(0),

    // must have a start timestamp
    start: t.bigint().notNull(),
    // may have an expiration
    expiration: t.bigint(),
    // maybe have a grace period (BaseRegistrar)
    gracePeriod: t.bigint(),

    // registrar AccountId
    registrarChainId: t.integer().notNull().$type<ChainId>(),
    registrarAddress: t.hex().notNull().$type<Address>(),

    // references registrant
    registrantId: t.hex().$type<Address>(),

    // references referrer
    referrer: t.hex().$type<EncodedReferrer>(),

    // may have fuses
    fuses: t.integer(),

    // may have baseCost/premium
    baseCost: t.bigint(),
    premium: t.bigint(),

    // may be Wrapped (BaseRegistrar)
    wrapped: t.boolean().default(false),
    wrappedFuses: t.integer(),
    wrappedExpiration: t.bigint(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.domainId, t.index),
  }),
);

export const registration_relations = relations(registration, ({ one, many }) => ({
  domain: one(domain, {
    fields: [registration.domainId],
    references: [domain.id],
  }),
  registrant: one(account, {
    fields: [registration.registrantId],
    references: [account.id],
  }),
}));

///////////////
// Permissions
///////////////

export const permissions = onchainTable(
  "permissions",
  (t) => ({
    id: t.text().primaryKey().$type<PermissionsId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.chainId, t.address),
  }),
);

export const relations_permissions = relations(permissions, ({ one, many }) => ({
  resources: many(permissionsResource),
  users: many(permissionsUser),
}));

export const permissionsResource = onchainTable(
  "permissions_resources",
  (t) => ({
    id: t.text().primaryKey().$type<PermissionsResourceId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    resource: t.bigint().notNull(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.chainId, t.address, t.resource),
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
    id: t.text().primaryKey().$type<PermissionsUserId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    resource: t.bigint().notNull(),
    user: t.hex().notNull().$type<Address>(),

    // has one roles bitmap
    roles: t.bigint().notNull(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.chainId, t.address, t.resource, t.user),
  }),
);

export const relations_permissionsUser = relations(permissionsUser, ({ one, many }) => ({
  account: one(account, {
    fields: [permissionsUser.user],
    references: [account.id],
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
  needsHeal: t.boolean().default(false),
}));

export const label_relations = relations(label, ({ many }) => ({
  domains: many(domain),
}));
