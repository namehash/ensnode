import { index, onchainEnum, onchainTable, relations, uniqueIndex } from "ponder";
import type { Address, Hash } from "viem";

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
  RenewalId,
} from "@ensnode/ensnode-sdk";

/**
 * The ENSv2 Schema
 *
 * While the initial approach was a highly materialized view of the ENS protocol, abstracting away
 * as many on-chain details as possible, in practice—due to the sheer complexity of the protocol at
 * resolution-time—it becomes more or less impossible to appropriately materialize the canonical
 * namegraph.
 *
 * As a result, this schema takes a balanced approach. It mimics on-chain state as closely as possible,
 * with the obvious exception of materializing specific state that must trivially filterable. Then,
 * resolution-time logic is applied on _top_ of this index, at query-time, mimicking ENS's own resolution-time
 * behavior. This forces our implementation to match the protocol as closely as possible, with the
 * obvious note that the performance tradeoffs of evm code and our app are different. For example,
 * it's more expensive for us to recursively traverse the namegraph (like evm code does) because our
 * individual roundtrips from the db are relatively more expensive.
 *
 * For the datamodel, this means that instead of a polymorphic Domain entity, representing both v1
 * and v2 Domains, this schema employs separate (but overlapping) v1Domains and v2Domains entities.
 * This avoids resolution-time complications and more accurately represents the on-chain state.
 * Domain polymorphism is applied at the API later, via GraphQL Interfaces, to simplify queries.
 *
 * In general: the indexed schema should match on-chain state as closely as possible, and
 * resolution-time behavior within the ENS protocol should _also_ be implemented at resolution time
 * in ENSApi. The current obvious exception to this is that v1Domain.owner is the _materialized_
 * _effective_ owner of the v1Domain. ENSv1 includes a mind-boggling number of ways to 'own' a v1Domain,
 * including the ENSv1 Registry, various Registrars, and the NameWrapper. The ENSv1 indexing logic
 * within this ENSv2 plugin materialize the v1Domain's effective owner to simplify this aspect of ENS,
 * and enable efficient queries against v1Domain.owner.
 *
 * Many datamodels are shared between ENSv1 and ENSv2, including Registrations, Renewals, and Resolvers.
 *
 * Registrations are polymorphic between the defined RegistrationTypes, depending on the associated
 * guarantees (for example, ENSv1 BaseRegistrar Registrations may have a gracePeriod, but ENSv2
 * Registry Registrations do not).
 *
 * Instead of materializing a Domain's name at any point, we maintain an internal rainbow table of
 * labelHash -> InterpretedLabel (the Label entity). This ensures that regardless of how or when a
 * new label is encountered onchain, all Domains that use that label are automatically healed at
 * resolution-time.
 *
 * v1Domains exist in a flat namespace and are absolutely addressed by `node`. As such, they describe
 * a simple tree datamodel of:
 *   v1Domain -> v1Domain(s) -> v1Domain(s) -> ...etc
 *
 * v2Domains exist in a set of namegraphs. Each namegraph is a possibly cicular directed graph of
 *   (Root)Registry -> v2Domain(s) -> (sub)Regsitry -> v2Domain(s) -> ...etc
 * with exactly one RootRegistry on the ENS Root Chain establishing the beginning of the _canonical_
 * namegraph. As discussed above, the canonical namegraph is never materialized, only _navigated_
 * at resolution-time, in order to correctly implement the complexities of the ENS protocol.
 *
 * Note also that the Protocol Acceleration plugin is a hard requirement for the ENSv2 plugin. This
 * allows us to rely on the shared logic for indexing:
 *   a) ENSv1RegistryOld -> ENSv1Registry migration status
 *   b) Domain-Resolver Relations for both v1Domains and v2Domains
 * As such, none of that information is present in this ensv2.schema.ts file.
 *
 * In general, entities are keyed by a nominally-typed `id` that uniquely references them. This
 * allows us to trivially implement cursor-based pagination and allow consumers to reference these
 * deeply nested entities by a straightforward string ID. In cases where an entity's `id` is composed
 * of multiple pieces of information (for example, a Registry is identified by (chainId, address)),
 * then that information is, as well, included in the entity's columns, not just encoded in the id.
 *
 * Many entities may directly reference an Event, which represents the metadata associated with the
 * on-chain event responsible for its existence.
 */

/////////
// Event
/////////

export const event = onchainTable("events", (t) => ({
  // Ponder's event.id
  id: t.text().primaryKey(),

  // Event Metadata
  chainId: t.integer().notNull().$type<ChainId>(),
  address: t.hex().notNull().$type<Address>(),
  blockHash: t.hex().notNull().$type<Hash>(),
  timestamp: t.bigint().notNull(),
  transactionHash: t.hex().notNull().$type<Hash>(),
  logIndex: t.integer().notNull().$type<number>(),
}));

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
    byLabelHash: index().on(t.labelHash),
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

    // has a tokenId
    tokenId: t.bigint().notNull(),

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
    bySubregistry: index().on(t.subregistryId),
    byOwner: index().on(t.ownerId),
    byLabelHash: index().on(t.labelHash),
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
  // TODO: prefix these with ENSv1, maybe excluding ThreeDNS
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
    // may have an expiry
    expiry: t.bigint(),
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

    // TODO(paymentToken): add payment token tracking here

    // may have base cost (BaseRegistrar, ENSv2Registrar)
    base: t.bigint(),

    // may have a premium (BaseRegistrar)
    premium: t.bigint(),

    // may be Wrapped (BaseRegistrar)
    wrapped: t.boolean().default(false),

    // has an event
    eventId: t.text().notNull(),
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

  // has many renewals
  renewals: many(renewal),

  // has an event
  event: one(event, {
    fields: [registration.eventId],
    references: [event.id],
  }),
}));

////////////
// Renewals
////////////

export const renewal = onchainTable(
  "renewals",
  (t) => ({
    // keyed by (registrationId, index)
    id: t.text().primaryKey().$type<RenewalId>(),

    domainId: t.text().notNull().$type<DomainId>(),
    registrationIndex: t.integer().notNull().default(0),
    index: t.integer().notNull().default(0),

    // all renewals have a duration
    duration: t.bigint().notNull(),

    // may have a referrer
    referrer: t.hex().$type<EncodedReferrer>(),

    // TODO(paymentToken): add payment token tracking here

    // may have base cost
    base: t.bigint(),

    // may have a premium (ENSv1 RegistrarControllers)
    premium: t.bigint(),

    // has an event
    eventId: t.text().notNull(),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.domainId, t.registrationIndex, t.index),
  }),
);

export const renewal_relations = relations(renewal, ({ one }) => ({
  // belongs to registration
  registration: one(registration, {
    fields: [renewal.domainId, renewal.registrationIndex],
    references: [registration.domainId, registration.index],
  }),

  // has an event
  event: one(event, {
    fields: [renewal.eventId],
    references: [event.id],
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

export const relations_permissions = relations(permissions, ({ many }) => ({
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

export const relations_permissionsResource = relations(permissionsResource, ({ one }) => ({
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

export const relations_permissionsUser = relations(permissionsUser, ({ one }) => ({
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

export const label = onchainTable(
  "labels",
  (t) => ({
    labelHash: t.hex().primaryKey().$type<LabelHash>(),
    interpreted: t.text().notNull().$type<InterpretedLabel>(),
  }),
  (t) => ({
    byInterpreted: index().on(t.interpreted),
  }),
);

export const label_relations = relations(label, ({ many }) => ({
  domains: many(v2Domain),
}));

///////////////////
// Canonical Names
///////////////////

// TODO(canonical-names): this table will be refactored away once Canonical Names are implemented in
// ENSv2, and we'll be able to store this information directly on the Registry entity, but until
// then we need a place to track canonical domain references without requiring that a Registry contract
// has emitted an event (and therefore is indexed)
// TODO(canonical-names): this table can also disappear once the Signal pattern is implemented for
// Registry contracts, ensuring that they are indexed during construction and are available for storage.
export const registryCanonicalDomain = onchainTable("registry_canonical_domains", (t) => ({
  registryId: t.text().primaryKey().$type<RegistryId>(),
  domainId: t.text().notNull().$type<ENSv2DomainId>(),
}));
