import { index, onchainEnum, onchainTable, relations, uniqueIndex } from "ponder";
import type { Address } from "viem";

import type {
  ChainId,
  DomainId,
  ENSv1DomainId,
  ENSv2DomainId,
  EncodedReferrer,
  InterpretedLabel,
  LabelHash,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
} from "@ensnode/ensnode-sdk";

///////////
// Account
///////////

export const account = onchainTable("accounts", (t) => ({
  id: t.hex().primaryKey().$type<Address>(),
}));

export const account_relations = relations(account, ({ many }) => ({
  registrations: many(registration, { relationName: "registrant" }),
  domains: many(v2Domain),
  permissions: many(permissionsUser),
}));

////////////
// Registry
////////////

export const registry = onchainTable(
  "registries",
  (t) => ({
    // see RegistryId for guarantees
    id: t.text().primaryKey().$type<RegistryId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.chainId, t.address),
  }),
);

export const relations_registry = relations(registry, ({ one, many }) => ({
  domain: one(v2Domain, {
    relationName: "subregistry",
    fields: [registry.id],
    references: [v2Domain.registryId],
  }),
  domains: many(v2Domain, { relationName: "registry" }),
  permissions: one(permissions, {
    relationName: "permissions",
    fields: [registry.chainId, registry.address],
    references: [permissions.chainId, permissions.address],
  }),
}));

///////////
// Domains
///////////

export const v1Domain = onchainTable(
  "v1_domains",
  (t) => ({
    // keyed by node, see ENSv1DomainId for guarantees.
    id: t.text().primaryKey().$type<ENSv1DomainId>(),

    // must have a parent v1Domain (note: root node does not exist in index)
    parentId: t.text().notNull().$type<ENSv1DomainId>(),

    // may have an owner
    ownerId: t.hex().$type<Address>(),

    // represents a labelHash
    labelHash: t.hex().notNull().$type<LabelHash>(),

    // NOTE: Domain-Resolver Relations tracked via Protocol Acceleration plugin
  }),
  (t) => ({
    byParent: index().on(t.parentId),
    byOwner: index().on(t.ownerId),
  }),
);

export const relations_v1Domain = relations(v1Domain, ({ one, many }) => ({
  // v1Domain
  parent: one(v1Domain, {
    fields: [v1Domain.parentId],
    references: [v1Domain.id],
  }),
  children: many(v1Domain, { relationName: "parent" }),

  // shared
  owner: one(account, {
    relationName: "owner",
    fields: [v1Domain.ownerId],
    references: [account.id],
  }),
  label: one(label, {
    relationName: "label",
    fields: [v1Domain.labelHash],
    references: [label.labelHash],
  }),
  registrations: many(registration),
}));

export const v2Domain = onchainTable(
  "v2_domains",
  (t) => ({
    // see ENSv2DomainId for guarantees
    id: t.text().primaryKey().$type<ENSv2DomainId>(),

    // belongs to registry
    registryId: t.text().notNull().$type<RegistryId>(),

    // may have one subregistry
    subregistryId: t.text().$type<RegistryId>(),

    // may have an owner
    ownerId: t.hex().$type<Address>(),

    // represents a labelHash
    labelHash: t.hex().notNull().$type<LabelHash>(),

    // NOTE: Domain-Resolver Relations tracked via Protocol Acceleration plugin
  }),
  (t) => ({
    byRegistry: index().on(t.registryId),
    byOwner: index().on(t.ownerId),
  }),
);

export const relations_v2Domain = relations(v2Domain, ({ one, many }) => ({
  // v2Domain
  registry: one(registry, {
    relationName: "registry",
    fields: [v2Domain.registryId],
    references: [registry.id],
  }),
  subregistry: one(registry, {
    relationName: "subregistry",
    fields: [v2Domain.subregistryId],
    references: [registry.id],
  }),

  // shared
  owner: one(account, {
    relationName: "owner",
    fields: [v2Domain.ownerId],
    references: [account.id],
  }),
  label: one(label, {
    relationName: "label",
    fields: [v2Domain.labelHash],
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
  "ENSv2Registry",
]);

export const registration = onchainTable(
  "registrations",
  (t) => ({
    // keyed by (domainId, index)
    id: t.text().primaryKey().$type<RegistrationId>(),

    domainId: t.text().notNull().$type<DomainId>(),
    index: t.integer().notNull().default(0),

    // has a type
    type: registrationType().notNull(),

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

    // may have a referrer
    referrer: t.hex().$type<EncodedReferrer>(),

    // may have fuses (NameWrapper, Wrapped BaseRegistrar)
    fuses: t.integer(),

    // may have baseCost/premium (BaseRegistrar)
    baseCost: t.bigint(),
    premium: t.bigint(),

    // may be Wrapped (BaseRegistrar)
    wrapped: t.boolean().default(false),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.domainId, t.index),
  }),
);

export const registration_relations = relations(registration, ({ one, many }) => ({
  // belongs to either v1Domain or v2Domain
  v1Domain: one(v1Domain, {
    fields: [registration.domainId],
    references: [v1Domain.id],
  }),
  v2Domain: one(v2Domain, {
    fields: [registration.domainId],
    references: [v2Domain.id],
  }),

  // has one registrant
  registrant: one(account, {
    fields: [registration.registrantId],
    references: [account.id],
    relationName: "registrant",
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
}));

export const label_relations = relations(label, ({ many }) => ({
  domains: many(v2Domain),
}));
