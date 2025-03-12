import { CAIP10AccountId } from "@ensnode/utils/types";
import { index, onchainTable, relations, uniqueIndex } from "ponder";
import { type Address, zeroAddress } from "viem";
import { monkeypatchCollate } from "./collate";

/**
 * Domain
 */

export const domain = onchainTable("domains", (t) => ({
  // The namehash of the name
  id: t.hex().primaryKey(),
  // The human readable name, if known. Unknown portions replaced with hash in square brackets (eg, foo.[1234].eth)
  name: t.text(),
  // The human readable label name (imported from CSV), if known
  labelName: t.text("label_name"),
  // keccak256(labelName)
  labelhash: t.hex(),
  // The namehash (id) of the parent name
  parentId: t.hex(),

  // The number of subdomains
  subdomainCount: t.integer("subdomain_count").notNull().default(0),

  // Address logged from current resolver, if any
  resolvedAddressId: t.hex("resolved_address_id"),

  // The resolver that controls the domain's settings
  resolverId: t.text(),

  // The time-to-live (TTL) value of the domain's records
  ttl: t.bigint(),

  // Indicates whether the domain has been migrated to a new registrar
  isMigrated: t.boolean("is_migrated").notNull().default(false),
  // The time when the domain was created
  createdAt: t.bigint("created_at").notNull(),

  // The account that owns the domain
  ownerId: t.hex("owner_id").notNull(),
  // The account that owns the ERC721 NFT for the domain
  registrantId: t.hex("registrant_id"),
  // The account that owns the wrapped domain
  wrappedOwnerId: t.hex("wrapped_owner_id"),

  // The expiry date for the domain, from either the registration, or the wrapped domain if PCC is burned
  expiryDate: t.bigint("expiry_date"),
}));

// monkeypatch drizzle's column (necessary to match graph-node default collation "C")
// https://github.com/drizzle-team/drizzle-orm/issues/638
monkeypatchCollate(domain.name, '"C"');
monkeypatchCollate(domain.labelName, '"C"');

export const domainRelations = relations(domain, ({ one, many }) => ({
  resolvedAddress: one(account, {
    fields: [domain.resolvedAddressId],
    references: [account.id],
  }),
  owner: one(account, { fields: [domain.ownerId], references: [account.id] }),
  parent: one(domain, { fields: [domain.parentId], references: [domain.id] }),
  resolver: one(resolver, {
    fields: [domain.resolverId],
    references: [resolver.id],
  }),
  subdomains: many(domain, { relationName: "parent" }),
  registrant: one(account, {
    fields: [domain.registrantId],
    references: [account.id],
  }),
  wrappedOwner: one(account, {
    fields: [domain.wrappedOwnerId],
    references: [account.id],
  }),
  wrappedDomain: one(wrappedDomain, {
    fields: [domain.id],
    references: [wrappedDomain.domainId],
  }),
  registration: one(registration, {
    fields: [domain.id],
    references: [registration.domainId],
  }),

  // event relations
  transfers: many(transfer),
  newOwners: many(newOwner),
  newResolvers: many(newResolver),
  newTTLs: many(newTTL),
  wrappedTransfers: many(wrappedTransfer),
  nameWrappeds: many(nameWrapped),
  nameUnwrappeds: many(nameUnwrapped),
  fusesSets: many(fusesSet),
  expiryExtendeds: many(expiryExtended),
}));

/**
 * Account
 */

export const account = onchainTable("accounts", (t) => ({
  id: t.hex().primaryKey(),
}));

export const accountRelations = relations(account, ({ many }) => ({
  domains: many(domain),
  wrappedDomains: many(wrappedDomain),
  registrations: many(registration),
}));

/**
 * Resolver
 */

export const resolver = onchainTable(
  "resolvers",
  (t) => ({
    // The unique identifier for this resolver, which is a concatenation of the domain namehash and the resolver address
    id: t.text().primaryKey(),
    // The domain that this resolver is associated with
    domainId: t.hex("domain_id").notNull(),
    // The address of the resolver contract
    address: t.hex().notNull().$type<Address>(),

    // The current value of the 'addr' record for this resolver, as determined by the associated events
    addrId: t.hex("addr_id"),
    // The content hash for this resolver, in binary format
    contentHash: t.text("content_hash"),
    // The set of observed text record keys for this resolver
    // NOTE: we avoid .notNull.default([]) to match subgraph behavior
    texts: t.text().array(),
    // The set of observed SLIP-44 coin types for this resolver
    // NOTE: we avoid .notNull.default([]) to match subgraph behavior
    coinTypes: t.bigint().array(),
  }),
  (t) => ({
    idx: index().on(t.domainId),
  }),
);

export const resolverRelations = relations(resolver, ({ one, many }) => ({
  addr: one(account, { fields: [resolver.addrId], references: [account.id] }),
  domain: one(domain, { fields: [resolver.domainId], references: [domain.id] }),

  // event relations
  addrChangeds: many(addrChanged),
  multicoinAddrChangeds: many(multicoinAddrChanged),
  nameChangeds: many(nameChanged),
  abiChangeds: many(abiChanged),
  pubkeyChangeds: many(pubkeyChanged),
  textChangeds: many(textChanged),
  contenthashChangeds: many(contenthashChanged),
  interfaceChangeds: many(interfaceChanged),
  authorisationChangeds: many(authorisationChanged),
  versionChangeds: many(versionChanged),
}));

/**
 * Registration
 */

export const registration = onchainTable(
  "registrations",
  (t) => ({
    // The unique identifier of the registration
    id: t.hex().primaryKey(),
    // The domain name associated with the registration
    domainId: t.hex("domain_id").notNull(),
    // The registration date of the domain
    registrationDate: t.bigint("registration_date").notNull(),
    // The expiry date of the domain
    expiryDate: t.bigint("expiry_date").notNull(),
    // The cost associated with the domain registration
    cost: t.bigint(),
    // The account that registered the domain
    registrantId: t.hex("registrant_id").notNull(),
    // The human-readable label name associated with the domain registration
    labelName: t.text(),
  }),
  (t) => ({
    idx: index().on(t.domainId),
  }),
);

export const registrationRelations = relations(registration, ({ one, many }) => ({
  domain: one(domain, {
    fields: [registration.domainId],
    references: [domain.id],
  }),
  registrant: one(account, {
    fields: [registration.registrantId],
    references: [account.id],
  }),

  // event relations
  nameRegistereds: many(nameRegistered),
  nameReneweds: many(nameRenewed),
  nameTransferreds: many(nameTransferred),
}));

/**
 * Wrapped Domain
 */

export const wrappedDomain = onchainTable(
  "wrapped_domains",
  (t) => ({
    // The unique identifier for each instance of the WrappedDomain entity
    id: t.hex().primaryKey(),
    // The domain that is wrapped by this WrappedDomain
    domainId: t.hex("domain_id").notNull(),
    // The expiry date of the wrapped domain
    expiryDate: t.bigint("expiry_date").notNull(),
    // The number of fuses remaining on the wrapped domain
    fuses: t.integer().notNull(),
    // The account that owns this WrappedDomain
    ownerId: t.hex("owner_id").notNull(),
    // The name of the wrapped domain
    name: t.text(),
  }),
  (t) => ({
    idx: index().on(t.domainId),
  }),
);

export const wrappedDomainRelations = relations(wrappedDomain, ({ one }) => ({
  domain: one(domain, {
    fields: [wrappedDomain.domainId],
    references: [domain.id],
  }),
  owner: one(account, {
    fields: [wrappedDomain.ownerId],
    references: [account.id],
  }),
}));

/**
 * Events
 */

const sharedEventColumns = (t: any) => ({
  id: t.text().primaryKey(),
  blockNumber: t.integer("block_number").notNull(),
  transactionID: t.hex("transaction_id").notNull(),
});

const domainEvent = (t: any) => ({
  ...sharedEventColumns(t),
  domainId: t.hex("domain_id").notNull(),
});

const domainEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.domainId),
  // sorting index
  idx_compound: index().on(t.domainId, t.id),
});

// Domain Event Entities

export const transfer = onchainTable(
  "transfers",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex("owner_id").notNull(),
  }),
  domainEventIndex,
);

export const newOwner = onchainTable(
  "new_owners",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex("owner_id").notNull(),
    parentDomainId: t.hex("parent_domain_id").notNull(),
  }),
  domainEventIndex,
);

export const newResolver = onchainTable(
  "new_resolvers",
  (t) => ({
    ...domainEvent(t),
    resolverId: t.text("resolver_id").notNull(),
  }),
  domainEventIndex,
);

export const newTTL = onchainTable(
  "new_ttls",
  (t) => ({
    ...domainEvent(t),
    ttl: t.bigint().notNull(),
  }),
  domainEventIndex,
);

export const wrappedTransfer = onchainTable(
  "wrapped_transfers",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex("owner_id").notNull(),
  }),
  domainEventIndex,
);

export const nameWrapped = onchainTable(
  "name_wrapped",
  (t) => ({
    ...domainEvent(t),
    name: t.text(),
    fuses: t.integer().notNull(),
    ownerId: t.hex("owner_id").notNull(),
    expiryDate: t.bigint("expiry_date").notNull(),
  }),
  domainEventIndex,
);

export const nameUnwrapped = onchainTable(
  "name_unwrapped",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex("owner_id").notNull(),
  }),
  domainEventIndex,
);

export const fusesSet = onchainTable(
  "fuses_set",
  (t) => ({
    ...domainEvent(t),
    fuses: t.integer().notNull(),
  }),
  domainEventIndex,
);

export const expiryExtended = onchainTable(
  "expiry_extended",
  (t) => ({
    ...domainEvent(t),
    expiryDate: t.bigint("expiry_date").notNull(),
  }),
  domainEventIndex,
);

// Registration Event Entities

const registrationEvent = (t: any) => ({
  ...sharedEventColumns(t),
  registrationId: t.hex("registration_id").notNull(),
});

const registrationEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.registrationId),
  // sorting index
  idx_compound: index().on(t.registrationId, t.id),
});

export const nameRegistered = onchainTable(
  "name_registered",
  (t) => ({
    ...registrationEvent(t),
    registrantId: t.hex("registrant_id").notNull(),
    expiryDate: t.bigint("expiry_date").notNull(),
  }),
  registrationEventIndex,
);

export const nameRenewed = onchainTable(
  "name_renewed",
  (t) => ({
    ...registrationEvent(t),
    expiryDate: t.bigint("expiry_date").notNull(),
  }),
  registrationEventIndex,
);

export const nameTransferred = onchainTable(
  "name_transferred",
  (t) => ({
    ...registrationEvent(t),
    newOwnerId: t.hex("new_owner_id").notNull(),
  }),
  registrationEventIndex,
);

// Resolver Event Entities

const resolverEvent = (t: any) => ({
  ...sharedEventColumns(t),
  resolverId: t.text("resolver_id").notNull(),
});

const resolverEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.resolverId),
  // sorting index
  idx_compound: index().on(t.resolverId, t.id),
});

export const addrChanged = onchainTable(
  "addr_changed",
  (t) => ({
    ...resolverEvent(t),
    addrId: t.hex("addr_id").notNull(),
  }),
  resolverEventIndex,
);

export const multicoinAddrChanged = onchainTable(
  "multicoin_addr_changed",
  (t) => ({
    ...resolverEvent(t),
    coinType: t.bigint("coin_type").notNull(),
    addr: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const nameChanged = onchainTable(
  "name_changed",
  (t) => ({
    ...resolverEvent(t),
    name: t.text().notNull(),
  }),
  resolverEventIndex,
);

export const abiChanged = onchainTable(
  "abi_changed",
  (t) => ({
    ...resolverEvent(t),
    contentType: t.bigint("content_type").notNull(),
  }),
  resolverEventIndex,
);

export const pubkeyChanged = onchainTable(
  "pubkey_changed",
  (t) => ({
    ...resolverEvent(t),
    x: t.hex().notNull(),
    y: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const textChanged = onchainTable(
  "text_changed",
  (t) => ({
    ...resolverEvent(t),
    key: t.text().notNull(),
    value: t.text(),
  }),
  resolverEventIndex,
);

export const contenthashChanged = onchainTable(
  "contenthash_changed",
  (t) => ({
    ...resolverEvent(t),
    hash: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const interfaceChanged = onchainTable(
  "interface_changed",
  (t) => ({
    ...resolverEvent(t),
    interfaceID: t.hex("interface_id").notNull(),
    implementer: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const authorisationChanged = onchainTable(
  "authorisation_changed",
  (t) => ({
    ...resolverEvent(t),
    owner: t.hex().notNull(),
    target: t.hex().notNull(),
    isAuthorized: t.boolean("is_authorized").notNull(),
  }),
  resolverEventIndex,
);

export const versionChanged = onchainTable(
  "version_changed",
  (t) => ({
    ...resolverEvent(t),
    version: t.bigint().notNull(),
  }),
  resolverEventIndex,
);

/**
 * Event Relations
 */

// Domain Event Relations

export const transferRelations = relations(transfer, ({ one }) => ({
  domain: one(domain, { fields: [transfer.domainId], references: [domain.id] }),
  owner: one(account, { fields: [transfer.ownerId], references: [account.id] }),
}));

export const newOwnerRelations = relations(newOwner, ({ one }) => ({
  domain: one(domain, { fields: [newOwner.domainId], references: [domain.id] }),
  owner: one(account, { fields: [newOwner.ownerId], references: [account.id] }),
  parentDomain: one(domain, {
    fields: [newOwner.parentDomainId],
    references: [domain.id],
  }),
}));

export const newResolverRelations = relations(newResolver, ({ one }) => ({
  domain: one(domain, {
    fields: [newResolver.domainId],
    references: [domain.id],
  }),
  resolver: one(resolver, {
    fields: [newResolver.resolverId],
    references: [resolver.id],
  }),
}));

export const newTTLRelations = relations(newTTL, ({ one }) => ({
  domain: one(domain, { fields: [newTTL.domainId], references: [domain.id] }),
}));

export const wrappedTransferRelations = relations(wrappedTransfer, ({ one }) => ({
  domain: one(domain, {
    fields: [wrappedTransfer.domainId],
    references: [domain.id],
  }),
  owner: one(account, {
    fields: [wrappedTransfer.ownerId],
    references: [account.id],
  }),
}));

export const nameWrappedRelations = relations(nameWrapped, ({ one }) => ({
  domain: one(domain, {
    fields: [nameWrapped.domainId],
    references: [domain.id],
  }),
  owner: one(account, {
    fields: [nameWrapped.ownerId],
    references: [account.id],
  }),
}));

export const nameUnwrappedRelations = relations(nameUnwrapped, ({ one }) => ({
  domain: one(domain, {
    fields: [nameUnwrapped.domainId],
    references: [domain.id],
  }),
  owner: one(account, {
    fields: [nameUnwrapped.ownerId],
    references: [account.id],
  }),
}));

export const fusesSetRelations = relations(fusesSet, ({ one }) => ({
  domain: one(domain, { fields: [fusesSet.domainId], references: [domain.id] }),
}));

export const expiryExtendedRelations = relations(expiryExtended, ({ one }) => ({
  domain: one(domain, {
    fields: [expiryExtended.domainId],
    references: [domain.id],
  }),
}));

// Registration Event Relations

export const nameRegisteredRelations = relations(nameRegistered, ({ one }) => ({
  registration: one(registration, {
    fields: [nameRegistered.registrationId],
    references: [registration.id],
  }),
  registrant: one(account, {
    fields: [nameRegistered.registrantId],
    references: [account.id],
  }),
}));

export const nameRenewedRelations = relations(nameRenewed, ({ one }) => ({
  registration: one(registration, {
    fields: [nameRenewed.registrationId],
    references: [registration.id],
  }),
}));

export const nameTransferredRelations = relations(nameTransferred, ({ one }) => ({
  registration: one(registration, {
    fields: [nameTransferred.registrationId],
    references: [registration.id],
  }),
  newOwner: one(account, {
    fields: [nameTransferred.newOwnerId],
    references: [account.id],
  }),
}));

// Resolver Event Relations

export const addrChangedRelations = relations(addrChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [addrChanged.resolverId],
    references: [resolver.id],
  }),
  addr: one(account, {
    fields: [addrChanged.addrId],
    references: [account.id],
  }),
}));

export const multicoinAddrChangedRelations = relations(multicoinAddrChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [multicoinAddrChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const nameChangedRelations = relations(nameChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [nameChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const abiChangedRelations = relations(abiChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [abiChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const pubkeyChangedRelations = relations(pubkeyChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [pubkeyChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const textChangedRelations = relations(textChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [textChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const contenthashChangedRelations = relations(contenthashChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [contenthashChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const interfaceChangedRelations = relations(interfaceChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [interfaceChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const authorisationChangedRelations = relations(authorisationChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [authorisationChanged.resolverId],
    references: [resolver.id],
  }),
}));

export const versionChangedRelations = relations(versionChanged, ({ one }) => ({
  resolver: one(resolver, {
    fields: [versionChanged.resolverId],
    references: [resolver.id],
  }),
}));

/**
 * ENS v2 Isolated Schema
 *
 * NOTE: These entities kept namespaced for rapid prototyping—see v2 plans for additional context.
 * https://www.ensnode.io/ensnode/reference/ensnode-v2-notes/
 *
 * The core design principle here is that a Registry references many Domains which each reference a
 * (sub)Registry which references many Domains... etc. This accurately represents the nature of the
 * on-chain contracts and supports the dynamic re-arrangement of the hierarchical namespace as
 * proposed by ENSv2.
 *
 * For example, when a subregistry is updated for a given Domain, the tree now represent's that
 * subregistry's Domains, without and bulk creation/deletion being necessary.
 *
 * open questions:
 * - how do v1 subregistries other than .eth handle the migration?
 * - what does v2's .eth registry `reliquishing` accomplish, from an indexing perspective?
 * - a 'registry' is... any contract tht implements ERC1155 and NewSubname()? may mean that we need to
 *   index every instance of those events... not very good at all... would be nice if a Registry contract
 *   emitted an event like NewRegistry() in constructor that indicated whether it was an ENS registry.
 *   or if it were required to announce itself against some singleton address and we could use the
 *   factory pattern to index those addresses. otherwise we'll need to track every ERC1155 contract.
 *   (ponder doesn't handle dynamic address indexing for efficiency reasons)
 * - could multiple tokenIds in the ENSv2 system have the same subregistry address? seems yes because
 *   datastore does not enforce uniqueness, but this results in a many-many mapping between labels
 *   and subregistries which seems very annoying to work with, in particular for upward traversals.
 *   the indexer could enforce uniqueness and if a name sets a registry address that's already assigned
 *   we could ignore that subtree? not ideal. since ENSv2 is on L2 we can likely include uniqueness
 *   check without too much of a penalty?
 *   search TODO(registry-domain-uniq): in codebase to see locations where this is noted
 * - event order guarantees would be really nice as part of the v2 spec, but technically not needed
 *   - i.e. registries must emit NewSubname before any ERC1155 events, must emit NewSubname before
 *     calling datastore, etc. indexers love an event that's guaranteed to be first in order to setup entity
 * - should token ids within registry contracts not be masked? what happens if registry mints
 *   multiple tokens with conflicting tokenIds? they'll have the same state in datastore but there will
 *   be multiple tokens in the 1155 contract with different owners, etc. how should the indexer represent this?
 * - we _need_ to be able to configure ponder's handling of null values in order to correctly index ENSv2
 *   because ENSv2 doesn't emit the namehash/labelhash, only human-readable args, which may contain null bytes
 *   https://github.com/ponder-sh/ponder/issues/1456
 *
 * todo in schema:
 * - events & event relations
 * - store node on label in order to set up resolver record references?
 * - createdAt and updatedAt values across the board
 * - could use composite schemas more frequently instead of concatenated ids
 */

/**
 * A Registry represents a Registry _contract_ on-chain, and is keyed by its chain-specific address.
 */
export const v2_registry = onchainTable(
  "v2_registries",
  (t) => ({
    /**
     * Registry is keyed by [CAIP-10](https://chainagnostic.org/CAIPs/caip-10)
     */
    id: t.text().primaryKey().$type<CAIP10AccountId>(),

    /**
     * A Registry can be the subregistry of exactly one Domain.
     * NOTE: we duplicate this reference in order to make cachable traversals trivial.
     * TODO(registry-domain-uniq): see above
     */
    domainId: t.text(),

    // TODO: reference registry-specific logic entities here (i.e. .eth registry expiries)
  }),
  (t) => ({}),
);

export const v2_registryRelations = relations(v2_registry, ({ one, many }) => ({
  /**
   * a registry has one domain (i.e is that domain's subregistry)
   *
   * TODO(registry-domain-uniq): see above
   */
  domain: one(v2_domain, {
    fields: [v2_registry.domainId],
    references: [v2_domain.id],
    relationName: "isSubregistryOfDomain",
  }),

  // a registry has many labels by label.registryId
  domains: many(v2_domain, {
    relationName: "managedDomains",
  }),
}));

/**
 * A Domain entity represents a subname in the hierarchical namespace.
 *
 * TODO: perhaps key by node instead of (registryId, tokenId)?
 *
 * In ENSv2 this maps 1:1 with a Registry contract's tokens.
 */
export const v2_domain = onchainTable(
  "v2_domains",
  (t) => ({
    /**
     * Domains are unique by (registryId, tokenId), encoded as `${registryId}-${tokenId}`
     */
    id: t.text().primaryKey(),

    /**
     * A Domain belongs to a Registry.
     */
    registryId: t.text().notNull(),

    /**
     * A Domain entity represents a given labelHash value i.e. the result of `labelhash()`, encoded as a bigint 'tokenId'.
     *
     * tokenId alone is _not_ a UUID value, and collisions are expected (i.e. there will be a Domain
     * entity representing the `hello` in `hello.example.eth` and a Domain representing the `hello`
     * in `hello.eth` that have identical tokenId values).
     *
     * Domain entities are unique by (registryId, tokenId), enforced by ERC1155.
     *
     * Note that in ENSv2, labelHashes (and tokenIds) have the lower 32 bits masked.
     */
    tokenId: t.bigint().notNull(),

    /**
     * The human-readable representation of a given name segment.
     *
     * In ENSv1, labels may or may not be known, hence this field is optional.
     * In ENSv2, this `label` is always known.
     */
    label: t.text(),

    /**
     * A Domain may have an URI.
     */
    uri: t.text(),

    /**
     * A Domain has an `owner` address, potentially zeroAddress.
     */
    owner: t.hex().notNull().default(zeroAddress),

    /**
     * A Domain can be assigned a (sub)Registry with flags.
     * NOTE: we include bi-directonal references in order to make cachable traversals trivial.
     */
    subregistryId: t.text(),
    subregistryFlags: t.bigint().notNull().default(0n),

    /**
     * A Domain can be configured with a given Resolver with flags.
     */
    resolverId: t.text(),
    resolverFlags: t.bigint().notNull().default(0n),
  }),
  (t) => ({
    // a Domain is unique by (registryId, tokenId)
    registryDomainHashIndex: uniqueIndex().on(t.registryId, t.tokenId),
  }),
);

export const v2_domainRelations = relations(v2_domain, ({ one, many }) => ({
  // domain belongs to one (parent)registry
  registry: one(v2_registry, {
    fields: [v2_domain.registryId],
    references: [v2_registry.id],
  }),

  // domain references one (sub)registry
  subregistry: one(v2_registry, {
    fields: [v2_domain.subregistryId],
    references: [v2_registry.id],
  }),

  // domain references one resolver
  resolver: one(v2_resolver, {
    fields: [v2_domain.resolverId],
    references: [v2_resolver.id],
  }),
}));

/**
 * A Resolver represents a given Resolver _contract_ on-chain.
 */
export const v2_resolver = onchainTable(
  "v2_resolvers",
  (t) => ({
    /**
     * Resolver are keyed by [CAIP-10](https://chainagnostic.org/CAIPs/caip-10).
     */
    id: t.text().primaryKey().$type<CAIP10AccountId>(),
  }),
  (t) => ({}),
);

export const v2_resolverRelations = relations(v2_resolver, ({ one, many }) => ({
  // any number of domains can reference a given Resolver
  domains: many(v2_domain),

  // resolver has many ResolverRecords
  records: many(v2_resolverRecords),
}));

/**
 * A ResolverRecords represents a pairwise relationship between a Resolver entity/contract
 * and a given `node`.
 */
export const v2_resolverRecords = onchainTable(
  "v2_resolver_records",
  (t) => ({
    /**
     * A ResolverRecords is keyed by (resolverId, node), encoded as `${resolverId}-${node}`.
     */
    id: t.text().primaryKey(),

    /**
     * A ResolverRecords maintains references to the Resolver contract and which node it stores
     * records for.
     */
    resolverId: t.text().notNull(),
    node: t.hex().notNull(),

    // TODO: implement all record storage here
  }),
  (t) => ({
    // uniquely index against the composite key
    idxResolverNode: uniqueIndex().on(t.resolverId, t.node),
  }),
);

export const v2_resolverRecordRelations = relations(v2_resolverRecords, ({ one, many }) => ({
  // records belongs to Resolver
  resolver: one(v2_resolver, {
    fields: [v2_resolverRecords.resolverId],
    references: [v2_resolver.id],
  }),

  // records has many addresses
  addresses: many(v2_resolverRecordsAddress),
}));

export const v2_resolverRecordsAddress = onchainTable(
  "v2_resolver_records_addresses",
  (t) => ({
    id: t.text().primaryKey(),
    resolverRecordsId: t.text().notNull(),
    coinType: t.bigint().notNull(),
    address: t.text().notNull(),
  }),
  (t) => ({
    byCoinType: index().on(t.id, t.coinType),
  }),
);

export const v2_resolverRecordsAddressRelations = relations(
  v2_resolverRecordsAddress,
  ({ one, many }) => ({
    // resolverrecordsaddress belongs to resolver records
    records: one(v2_resolverRecords, {
      fields: [v2_resolverRecordsAddress.resolverRecordsId],
      references: [v2_resolverRecords.id],
    }),
  }),
);
