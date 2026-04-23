import type {
  Address,
  ChainId,
  DomainId,
  InterpretedLabel,
  LabelHash,
  Node,
  PermissionsId,
  PermissionsResourceId,
  PermissionsUserId,
  RegistrationId,
  RegistryId,
  RenewalId,
  ResolverId,
  TokenId,
} from "enssdk";
import { index, onchainEnum, onchainTable, primaryKey, relations, sql, uniqueIndex } from "ponder";
import type { BlockNumber, Hash } from "viem";

import type { EncodedReferrer } from "@ensnode/ensnode-sdk";

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
 * In general: the indexed schema should match on-chain state as closely as possible, and
 * resolution-time behavior within the ENS protocol should _also_ be implemented at resolution time
 * in ENSApi. The current obvious exception is that `domain.ownerId` for ENSv1 Domains is the
 * _materialized_ _effective_ owner. ENSv1 includes a diverse number of ways to 'own' a domain,
 * including the ENSv1 Registry, various Registrars, and the NameWrapper. The ENSv1 indexing logic
 * within this ENSv2 plugin materializes the effective owner to simplify this aspect of ENS and
 * enable efficient queries against `domain.ownerId`.
 *
 * When necessary, all datamodels are shared or polymorphic between ENSv1 and ENSv2, including
 * Domains, Registries, Registrations, Renewals, and Resolvers.
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
 * ENSv1 and ENSv2 both fit the Registry → Domain → (Sub)Registry → Domain → ... namegraph model.
 * For ENSv1, each domain that has children implicitly owns a "virtual" Registry (a row of type
 * `ENSv1VirtualRegistry`) whose sole parent is that domain; children of the parent then point their
 * `registryId` at the virtual registry. Concrete `ENSv1Registry` rows (e.g. the mainnet ENS Registry,
 * the Basenames Registry, the Lineanames Registry, ThreeDNS Registries) sit at the top. ENSv2
 * namegraphs are rooted in a single `ENSv2Registry` RootRegistry on the ENS Root Chain and are
 * possibly circular directed graphs. The canonical namegraph is never materialized, only _navigated_
 * at resolution-time.
 *
 * Note also that the Protocol Acceleration plugin is a hard requirement for the ENSv2 plugin. This
 * allows us to rely on the shared logic for indexing:
 *   a) ENSv1RegistryOld -> ENSv1Registry migration status
 *   b) Domain-Resolver Relations for both ENSv1 and ENSv2 Domains
 * As such, none of that information is present in this ensv2.schema.ts file.
 *
 * In general, entities are keyed by a nominally-typed `id` that uniquely references them. This
 * allows us to trivially implement cursor-based pagination and allow consumers to reference these
 * deeply nested entities by a straightforward string ID. In cases where an entity's `id` is composed
 * of multiple pieces of information (for example, a Registry is identified by (chainId, address)),
 * then that information is, as well, included in the entity's columns, not just encoded in the id.
 * Nowhere in this application, nor in user applications, should an entity's id be parsed for its
 * constituent parts; all should be available, with their various type guarantees, on the entity
 * itself.
 *
 * Events are structured as a single "events" table which tracks EVM Event Metadata for any on-chain
 * Event. Then, join tables (DomainEvent, ResolverEvent, etc) track the relationship between an
 * entity that has many events (Domain, Resolver) to the relevant set of Events.
 *
 * A Registration references the event that initiated the Registration. A Renewal, too, references
 * the Event responsible for its existence.
 */

//////////
// Events
//////////

export const event = onchainTable(
  "events",
  (t) => ({
    // Ponder's event.id
    id: t.text().primaryKey(),

    // Event Log Metadata

    // chain
    chainId: t.integer().notNull().$type<ChainId>(),

    // block
    blockNumber: t.bigint().notNull().$type<BlockNumber>(),
    blockHash: t.hex().notNull().$type<Hash>(),
    timestamp: t.bigint().notNull(),

    // transaction
    transactionHash: t.hex().notNull().$type<Hash>(),
    transactionIndex: t.integer().notNull(),
    from: t.hex().notNull().$type<Address>(),
    to: t.hex().$type<Address>(), // NOTE: a null `to` means this was a tx that deployed a contract

    // log
    address: t.hex().notNull().$type<Address>(),
    logIndex: t.integer().notNull().$type<number>(),
    selector: t.hex().notNull().$type<Hash>(),
    topics: t.hex().array().notNull().$type<[Hash, ...Hash[]]>(),
    data: t.hex().notNull(),
  }),
  (t) => ({
    bySelector: index().on(t.selector),
    byFrom: index().on(t.from),
    byTimestamp: index().on(t.timestamp),
  }),
);

export const domainEvent = onchainTable(
  "domain_events",
  (t) => ({
    domainId: t.text().notNull().$type<DomainId>(),
    eventId: t.text().notNull(),
  }),
  (t) => ({ pk: primaryKey({ columns: [t.domainId, t.eventId] }) }),
);

export const resolverEvent = onchainTable(
  "resolver_events",
  (t) => ({
    resolverId: t.text().notNull().$type<ResolverId>(),
    eventId: t.text().notNull(),
  }),
  (t) => ({ pk: primaryKey({ columns: [t.resolverId, t.eventId] }) }),
);

export const permissionsEvent = onchainTable(
  "permissions_events",
  (t) => ({
    permissionsId: t.text().notNull().$type<PermissionsId>(),
    eventId: t.text().notNull(),
  }),
  (t) => ({ pk: primaryKey({ columns: [t.permissionsId, t.eventId] }) }),
);

///////////
// Account
///////////

export const account = onchainTable("accounts", (t) => ({
  id: t.hex().primaryKey().$type<Address>(),
}));

export const account_relations = relations(account, ({ many }) => ({
  registrations: many(registration, { relationName: "registrant" }),
  domains: many(domain),
  permissions: many(permissionsUser),
}));

////////////
// Registry
////////////

export const registryType = onchainEnum("RegistryType", [
  "ENSv1Registry",
  "ENSv1VirtualRegistry",
  "ENSv2Registry",
]);

export const registry = onchainTable(
  "registries",
  (t) => ({
    // see RegistryId for guarantees
    id: t.text().primaryKey().$type<RegistryId>(),

    // has a type
    type: registryType().notNull(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),

    // If this is an ENSv1VirtualRegistry, `node` is the namehash of the parent ENSv1 domain that
    // owns it, otherwise null.
    node: t.hex().$type<Node>(),
  }),
  (t) => ({
    // NOTE: non-unique index because multiple rows can share (chainId, address) across virtual registries
    byChainAddress: index().on(t.chainId, t.address),
  }),
);

export const relations_registry = relations(registry, ({ one, many }) => ({
  // domains that declare this registry as their parent registry
  domains: many(domain, { relationName: "registry" }),
  // domains that declare this registry as their subregistry
  domainsAsSubregistry: many(domain, { relationName: "subregistry" }),
  permissions: one(permissions, {
    relationName: "permissions",
    fields: [registry.chainId, registry.address],
    references: [permissions.chainId, permissions.address],
  }),
}));

///////////
// Domains
///////////

export const domainType = onchainEnum("DomainType", ["ENSv1Domain", "ENSv2Domain"]);

export const domain = onchainTable(
  "domains",
  (t) => ({
    // see DomainId for guarantees (ENSv1DomainId: `${ENSv1RegistryId}/${node}`, ENSv2DomainId: CAIP-19)
    id: t.text().primaryKey().$type<DomainId>(),

    // has a type
    type: domainType().notNull(),

    // belongs to a registry
    registryId: t.text().notNull().$type<RegistryId>(),

    // may have a subregistry
    subregistryId: t.text().$type<RegistryId>(),

    // If this is an ENSv2Domain, the TokenId within the ENSv2Registry, otherwise null.
    tokenId: t.bigint().$type<TokenId>(),

    // If this is an ENSv1Domain, The Domain's namehash, otherwise null.
    node: t.hex().$type<Node>(),

    // represents a labelHash
    labelHash: t.hex().notNull().$type<LabelHash>(),

    // may have an owner
    ownerId: t.hex().$type<Address>(),

    // If this is an ENSv1Domain, may have a `rootRegistryOwner`, otherwise null.
    rootRegistryOwnerId: t.hex().$type<Address>(),

    // NOTE: Domain-Resolver Relations tracked via Protocol Acceleration plugin
    // NOTE: parent is derived via registryCanonicalDomain, not stored on the domain row
  }),
  (t) => ({
    byType: index().on(t.type),
    byRegistry: index().on(t.registryId),
    bySubregistry: index().on(t.subregistryId).where(sql`${t.subregistryId} IS NOT NULL`),
    byOwner: index().on(t.ownerId),
    byLabelHash: index().on(t.labelHash),
  }),
);

export const relations_domain = relations(domain, ({ one, many }) => ({
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
  owner: one(account, {
    relationName: "owner",
    fields: [domain.ownerId],
    references: [account.id],
  }),
  rootRegistryOwner: one(account, {
    relationName: "rootRegistryOwner",
    fields: [domain.rootRegistryOwnerId],
    references: [account.id],
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
  // TODO: prefix these with ENSv1, maybe excluding ThreeDNS
  "NameWrapper",
  "BaseRegistrar",
  "ThreeDNS",
  "ENSv2RegistryRegistration",
  "ENSv2RegistryReservation",
]);

export const registration = onchainTable(
  "registrations",
  (t) => ({
    // keyed by (domainId, registrationIndex)
    id: t.text().primaryKey().$type<RegistrationId>(),

    domainId: t.text().notNull().$type<DomainId>(),
    registrationIndex: t.integer().notNull(),

    // has a type
    type: registrationType().notNull(),

    // has a start
    start: t.bigint().notNull(),
    // may have an expiry
    expiry: t.bigint(),
    // maybe have a grace period (BaseRegistrar)
    gracePeriod: t.bigint(),

    // registrar AccountId
    registrarChainId: t.integer().notNull().$type<ChainId>(),
    registrarAddress: t.hex().notNull().$type<Address>(),

    // may reference a registrant
    registrantId: t.hex().$type<Address>(),

    // may reference an unregistrant
    unregistrantId: t.hex().$type<Address>(),

    // may have referrer data
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
    byId: uniqueIndex().on(t.domainId, t.registrationIndex),
  }),
);

export const latestRegistrationIndex = onchainTable("latest_registration_indexes", (t) => ({
  domainId: t.text().primaryKey().$type<DomainId>(),
  registrationIndex: t.integer().notNull(),
}));

export const registration_relations = relations(registration, ({ one, many }) => ({
  // belongs to a domain
  domain: one(domain, {
    fields: [registration.domainId],
    references: [domain.id],
  }),

  // has one registrant
  registrant: one(account, {
    fields: [registration.registrantId],
    references: [account.id],
    relationName: "registrant",
  }),

  // has one unregistrant
  unregistrant: one(account, {
    fields: [registration.unregistrantId],
    references: [account.id],
    relationName: "unregistrant",
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
    registrationIndex: t.integer().notNull(),
    renewalIndex: t.integer().notNull(),

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
    byId: uniqueIndex().on(t.domainId, t.registrationIndex, t.renewalIndex),
  }),
);

export const renewal_relations = relations(renewal, ({ one }) => ({
  // belongs to registration
  registration: one(registration, {
    fields: [renewal.domainId, renewal.registrationIndex],
    references: [registration.domainId, registration.registrationIndex],
  }),

  // has an event
  event: one(event, {
    fields: [renewal.eventId],
    references: [event.id],
  }),
}));

export const latestRenewalIndex = onchainTable(
  "latest_renewal_indexes",
  (t) => ({
    domainId: t.text().notNull().$type<DomainId>(),
    registrationIndex: t.integer().notNull(),
    renewalIndex: t.integer().notNull(),
  }),
  (t) => ({ pk: primaryKey({ columns: [t.domainId, t.registrationIndex] }) }),
);

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
  domains: many(domain),
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
  domainId: t.text().notNull().$type<DomainId>(),
}));
