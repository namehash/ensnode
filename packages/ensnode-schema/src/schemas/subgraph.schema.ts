import { index, onchainTable, relations } from "ponder";
import type { Address } from "viem";
import { monkeypatchCollate } from "../lib/collate";

/**
 * This file specifies an Legacy-ENS-Subgraph-Compatible Ponder Schema.
 *
 * When the subgraph_prefix is stripped and the resulting schema is paired with @ensnode/ponder-subgraph,
 * the resulting GraphQL API is fully compatible with the legacy ENS Subgraph.
 */

/**
 * Domain
 */

export const subgraph_domain = onchainTable(
  "subgraph_domains",
  (t) => ({
    // The namehash of the name
    id: t.hex().primaryKey(),

    /**
     * The ENS Name that this Domain represents.
     *
     * If {@link ENSIndexerConfig#isSubgraphCompatible}, this value is guaranteed to be either:
     * a) null (in the case of the root node), or
     * b) a Subgraph Interpreted Name.
     *
     * @see https://ensnode.io/docs/reference/terminology#subgraph-indexability--labelname-interpretation
     *
     * Otherwise, this value is guaranteed to be an Interpreted Name, which is either:
     * a) a normalized Name, or
     * b) a Name entirely consisting of Interpreted Labels.
     *
     * Note that the type of the column will remain string | null, for legacy subgraph compatibility,
     * but in practice will never be null. The Root node's name will be '' (empty string).
     *
     * @see https://ensnode.io/docs/reference/terminology#interpreted-name
     */
    name: t.text(),

    /**
     * The Label associated with the Domain.
     *
     * If {@link ENSIndexerConfig#isSubgraphCompatible}, this value is guaranteed to be either:
     * a) null, in the case of the root Node or a name whose childmost label is subgraph-unindexable, or
     * b) a subgraph-indexable Subgraph Interpreted Label (i.e. a Literal Label of undefined normalization).
     *
     * @see https://ensnode.io/docs/reference/terminology#subgraph-indexability--labelname-interpretation
     *
     * Otherwise, this value is guaranteed to be an Interpreted Label which is either:
     * a) null, exclusively in the case of the root Node,
     * b) a normalized Label, or
     * c) an Encoded LabelHash, which encodes either
     *   i. in the case of an Unknown Label, the LabelHash emitted onchain, or
     *   ii. in the case of an Unnormalized Label, the LabelHash of the Literal Label value found onchain.
     *
     * @see https://ensnode.io/docs/reference/terminology#interpreted-label
     */
    labelName: t.text(),

    // keccak256(labelName)
    labelhash: t.hex(),
    // The namehash (id) of the parent name
    parentId: t.hex(),

    // The number of subdomains
    subdomainCount: t.integer().notNull().default(0),

    // Address logged from current resolver, if any
    resolvedAddressId: t.hex(),

    // The resolver that controls the domain's settings
    resolverId: t.text(),

    // The time-to-live (TTL) value of the domain's records
    ttl: t.bigint(),

    // Indicates whether the domain has been migrated to a new registrar
    isMigrated: t.boolean().notNull().default(false),
    // The time when the domain was created
    createdAt: t.bigint().notNull(),

    // The account that owns the domain
    ownerId: t.hex().notNull(),
    // The account that owns the ERC721 NFT for the domain
    registrantId: t.hex(),
    // The account that owns the wrapped domain
    wrappedOwnerId: t.hex(),

    // The expiry date for the domain, from either the registration, or the wrapped domain if PCC is burned
    expiryDate: t.bigint(),
  }),
  (t) => ({
    byLabelhash: index().on(t.labelhash),
    byParentId: index().on(t.parentId),
    byOwnerId: index().on(t.ownerId),
    byRegistrantId: index().on(t.registrantId),
    byWrappedOwnerId: index().on(t.wrappedOwnerId),
  }),
);

// monkeypatch drizzle's column (necessary to match graph-node default collation "C")
// https://github.com/drizzle-team/drizzle-orm/issues/638
monkeypatchCollate(subgraph_domain.name, '"C"');
monkeypatchCollate(subgraph_domain.labelName, '"C"');

export const subgraph_domainRelations = relations(subgraph_domain, ({ one, many }) => ({
  resolvedAddress: one(subgraph_account, {
    fields: [subgraph_domain.resolvedAddressId],
    references: [subgraph_account.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_domain.ownerId],
    references: [subgraph_account.id],
  }),
  parent: one(subgraph_domain, {
    fields: [subgraph_domain.parentId],
    references: [subgraph_domain.id],
  }),
  resolver: one(subgraph_resolver, {
    fields: [subgraph_domain.resolverId],
    references: [subgraph_resolver.id],
  }),
  subdomains: many(subgraph_domain, { relationName: "parent" }),
  registrant: one(subgraph_account, {
    fields: [subgraph_domain.registrantId],
    references: [subgraph_account.id],
  }),
  wrappedOwner: one(subgraph_account, {
    fields: [subgraph_domain.wrappedOwnerId],
    references: [subgraph_account.id],
  }),
  wrappedDomain: one(subgraph_wrappedDomain, {
    fields: [subgraph_domain.id],
    references: [subgraph_wrappedDomain.domainId],
  }),
  registration: one(subgraph_registration, {
    fields: [subgraph_domain.id],
    references: [subgraph_registration.domainId],
  }),

  // event relations
  transfers: many(subgraph_transfer),
  newOwners: many(subgraph_newOwner),
  newResolvers: many(subgraph_newResolver),
  newTTLs: many(subgraph_newTTL),
  wrappedTransfers: many(subgraph_wrappedTransfer),
  nameWrappeds: many(subgraph_nameWrapped),
  nameUnwrappeds: many(subgraph_nameUnwrapped),
  fusesSets: many(subgraph_fusesSet),
  expiryExtendeds: many(subgraph_expiryExtended),
}));

/**
 * Account
 */

export const subgraph_account = onchainTable("subgraph_accounts", (t) => ({
  id: t.hex().primaryKey(),
}));

export const subgraph_accountRelations = relations(subgraph_account, ({ many }) => ({
  domains: many(subgraph_domain),
  wrappedDomains: many(subgraph_wrappedDomain),
  registrations: many(subgraph_registration),
}));

/**
 * Resolver
 */

export const subgraph_resolver = onchainTable(
  "subgraph_resolvers",
  (t) => ({
    // The unique identifier for this resolver, which is a concatenation of the domain namehash and the resolver address
    id: t.text().primaryKey(),
    // The domain that this resolver is associated with
    domainId: t.hex().notNull(),
    // The address of the resolver contract
    address: t.hex().notNull().$type<Address>(),

    // The current value of the 'addr' record for this resolver, as determined by the associated events
    addrId: t.hex(),
    // The content hash for this resolver, in binary format
    contentHash: t.text(),
    // The set of observed text record keys for this resolver
    // NOTE: we avoid .notNull.default([]) to match subgraph behavior
    texts: t.text().array(),
    // The set of observed SLIP-44 coin types for this resolver
    // NOTE: we avoid .notNull.default([]) to match subgraph behavior
    coinTypes: t.bigint().array(),
  }),
  (t) => ({
    byDomainId: index().on(t.domainId),
  }),
);

export const subgraph_resolverRelations = relations(subgraph_resolver, ({ one, many }) => ({
  addr: one(subgraph_account, {
    fields: [subgraph_resolver.addrId],
    references: [subgraph_account.id],
  }),
  domain: one(subgraph_domain, {
    fields: [subgraph_resolver.domainId],
    references: [subgraph_domain.id],
  }),

  // event relations
  addrChangeds: many(subgraph_addrChanged),
  multicoinAddrChangeds: many(subgraph_multicoinAddrChanged),
  nameChangeds: many(subgraph_nameChanged),
  abiChangeds: many(subgraph_abiChanged),
  pubkeyChangeds: many(subgraph_pubkeyChanged),
  textChangeds: many(subgraph_textChanged),
  contenthashChangeds: many(subgraph_contenthashChanged),
  interfaceChangeds: many(subgraph_interfaceChanged),
  authorisationChangeds: many(subgraph_authorisationChanged),
  versionChangeds: many(subgraph_versionChanged),
}));

/**
 * Registration
 */

export const subgraph_registration = onchainTable(
  "subgraph_registrations",
  (t) => ({
    // The unique identifier of the registration
    id: t.hex().primaryKey(),
    // The domain name associated with the registration
    domainId: t.hex().notNull(),
    // The registration date of the domain
    registrationDate: t.bigint().notNull(),
    // The expiry date of the domain
    expiryDate: t.bigint().notNull(),
    // The cost associated with the domain registration
    cost: t.bigint(),
    // The account that registered the domain
    registrantId: t.hex().notNull(),
    /**
     * The Label associated with the domain registration.
     *
     * If {@link ENSIndexerConfig#isSubgraphCompatible}, this value is guaranteed to be either:
     * a) null, in the case of the root Node or a Domain whose label is subgraph-unindexable, or
     * b) a subgraph-indexable Subgraph Interpreted Label (i.e. a Literal Label of undefined normalization).
     *
     * @see https://ensnode.io/docs/reference/terminology#subgraph-indexability--labelname-interpretation
     *
     * Otherwise, this value is guaranteed to be an Interpreted Label which is either:
     * a) a normalized Label, or
     * b) in the case of an Unnormalized Label, an Encoded LabelHash of the Literal Label value found onchain.
     *
     * Note that the type of the column will remain string | null, for legacy subgraph compatibility.
     * In practice however, because there is no Registration entity for the root Node (the only Node
     * with a null labelName) this field will never be null.
     *
     * @see https://ensnode.io/docs/reference/terminology#interpreted-label
     */
    labelName: t.text(),
  }),
  (t) => ({
    byDomainId: index().on(t.domainId),
    byRegistrationDate: index().on(t.registrationDate),
  }),
);

export const subgraph_registrationRelations = relations(subgraph_registration, ({ one, many }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_registration.domainId],
    references: [subgraph_domain.id],
  }),
  registrant: one(subgraph_account, {
    fields: [subgraph_registration.registrantId],
    references: [subgraph_account.id],
  }),

  // event relations
  nameRegistereds: many(subgraph_nameRegistered),
  nameReneweds: many(subgraph_nameRenewed),
  nameTransferreds: many(subgraph_nameTransferred),
}));

/**
 * Wrapped Domain
 */

export const subgraph_wrappedDomain = onchainTable(
  "subgraph_wrapped_domains",
  (t) => ({
    // The unique identifier for each instance of the WrappedDomain entity
    id: t.hex().primaryKey(),
    // The domain that is wrapped by this WrappedDomain
    domainId: t.hex().notNull(),
    // The expiry date of the wrapped domain
    expiryDate: t.bigint().notNull(),
    // The number of fuses remaining on the wrapped domain
    fuses: t.integer().notNull(),
    // The account that owns this WrappedDomain
    ownerId: t.hex().notNull(),
    /**
     * The Name that this WrappedDomain represents. Names are emitted by the NameWrapper contract as
     * DNS-Encoded Names which may be malformed, which will result in this field being `null`.
     *
     * If {@link ENSIndexerConfig#isSubgraphCompatible}, this value is guaranteed to be either:
     * a) null (in the case of a DNS-Encoded Name that is malformed or contains subgraph-unindexable labels), or
     * b) a subgraph-indexable Subgraph Interpreted Label (i.e. a Literal Label of undefined normalization).
     *
     * @see https://ensnode.io/docs/reference/terminology#subgraph-indexability--labelname-interpretation
     *
     * Otherwise, this value is guaranteed to be either:
     * a) null (in the case of a malformed DNS-Encoded Name),
     * b) an Interpreted Name.
     *
     * @see https://ensnode.io/docs/reference/terminology#interpreted-name
     */
    name: t.text(),
  }),
  (t) => ({
    byDomainId: index().on(t.domainId),
  }),
);

export const subgraph_wrappedDomainRelations = relations(subgraph_wrappedDomain, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_wrappedDomain.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_wrappedDomain.ownerId],
    references: [subgraph_account.id],
  }),
}));

/**
 * Events
 */

const sharedEventColumns = (t: any) => ({
  id: t.text().primaryKey(),
  blockNumber: t.integer().notNull(),
  transactionID: t.hex().notNull(),
});

const domainEvent = (t: any) => ({
  ...sharedEventColumns(t),
  domainId: t.hex().notNull(),
});

const domainEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.domainId),
  // sorting index
  idx_compound: index().on(t.domainId, t.id),
});

// Domain Event Entities

export const subgraph_transfer = onchainTable(
  "subgraph_transfers",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_newOwner = onchainTable(
  "subgraph_new_owners",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
    parentDomainId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_newResolver = onchainTable(
  "subgraph_new_resolvers",
  (t) => ({
    ...domainEvent(t),
    resolverId: t.text().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_newTTL = onchainTable(
  "subgraph_new_ttls",
  (t) => ({
    ...domainEvent(t),
    ttl: t.bigint().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_wrappedTransfer = onchainTable(
  "subgraph_wrapped_transfers",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_nameWrapped = onchainTable(
  "subgraph_name_wrapped",
  (t) => ({
    ...domainEvent(t),
    name: t.text(),
    fuses: t.integer().notNull(),
    ownerId: t.hex().notNull(),
    expiryDate: t.bigint().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_nameUnwrapped = onchainTable(
  "subgraph_name_unwrapped",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_fusesSet = onchainTable(
  "subgraph_fuses_set",
  (t) => ({
    ...domainEvent(t),
    fuses: t.integer().notNull(),
  }),
  domainEventIndex,
);

export const subgraph_expiryExtended = onchainTable(
  "subgraph_expiry_extended",
  (t) => ({
    ...domainEvent(t),
    expiryDate: t.bigint().notNull(),
  }),
  domainEventIndex,
);

// Registration Event Entities

const registrationEvent = (t: any) => ({
  ...sharedEventColumns(t),
  registrationId: t.hex().notNull(),
});

const registrationEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.registrationId),
  // sorting index
  idx_compound: index().on(t.registrationId, t.id),
});

export const subgraph_nameRegistered = onchainTable(
  "subgraph_name_registered",
  (t) => ({
    ...registrationEvent(t),
    registrantId: t.hex().notNull(),
    expiryDate: t.bigint().notNull(),
  }),
  registrationEventIndex,
);

export const subgraph_nameRenewed = onchainTable(
  "subgraph_name_renewed",
  (t) => ({
    ...registrationEvent(t),
    expiryDate: t.bigint().notNull(),
  }),
  registrationEventIndex,
);

export const subgraph_nameTransferred = onchainTable(
  "subgraph_name_transferred",
  (t) => ({
    ...registrationEvent(t),
    newOwnerId: t.hex().notNull(),
  }),
  registrationEventIndex,
);

// Resolver Event Entities

const resolverEvent = (t: any) => ({
  ...sharedEventColumns(t),
  resolverId: t.text().notNull(),
});

const resolverEventIndex = (t: any) => ({
  // primary reverse lookup
  idx: index().on(t.resolverId),
  // sorting index
  idx_compound: index().on(t.resolverId, t.id),
});

export const subgraph_addrChanged = onchainTable(
  "subgraph_addr_changed",
  (t) => ({
    ...resolverEvent(t),
    addrId: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_multicoinAddrChanged = onchainTable(
  "subgraph_multicoin_addr_changed",
  (t) => ({
    ...resolverEvent(t),
    coinType: t.bigint().notNull(),
    addr: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_nameChanged = onchainTable(
  "subgraph_name_changed",
  (t) => ({
    ...resolverEvent(t),
    name: t.text().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_abiChanged = onchainTable(
  "subgraph_abi_changed",
  (t) => ({
    ...resolverEvent(t),
    contentType: t.bigint().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_pubkeyChanged = onchainTable(
  "subgraph_pubkey_changed",
  (t) => ({
    ...resolverEvent(t),
    x: t.hex().notNull(),
    y: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_textChanged = onchainTable(
  "subgraph_text_changed",
  (t) => ({
    ...resolverEvent(t),
    key: t.text().notNull(),
    value: t.text(),
  }),
  resolverEventIndex,
);

export const subgraph_contenthashChanged = onchainTable(
  "subgraph_contenthash_changed",
  (t) => ({
    ...resolverEvent(t),
    hash: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_interfaceChanged = onchainTable(
  "subgraph_interface_changed",
  (t) => ({
    ...resolverEvent(t),
    interfaceID: t.hex().notNull(),
    implementer: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_authorisationChanged = onchainTable(
  "subgraph_authorisation_changed",
  (t) => ({
    ...resolverEvent(t),
    owner: t.hex().notNull(),
    target: t.hex().notNull(),
    isAuthorized: t.boolean().notNull(),
  }),
  resolverEventIndex,
);

export const subgraph_versionChanged = onchainTable(
  "subgraph_version_changed",
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

export const subgraph_transferRelations = relations(subgraph_transfer, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_transfer.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_transfer.ownerId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_newOwnerRelations = relations(subgraph_newOwner, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_newOwner.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_newOwner.ownerId],
    references: [subgraph_account.id],
  }),
  parentDomain: one(subgraph_domain, {
    fields: [subgraph_newOwner.parentDomainId],
    references: [subgraph_domain.id],
  }),
}));

export const subgraph_newResolverRelations = relations(subgraph_newResolver, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_newResolver.domainId],
    references: [subgraph_domain.id],
  }),
  resolver: one(subgraph_resolver, {
    fields: [subgraph_newResolver.resolverId],
    references: [subgraph_resolver.id],
  }),
}));

export const subgraph_newTTLRelations = relations(subgraph_newTTL, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_newTTL.domainId],
    references: [subgraph_domain.id],
  }),
}));

export const subgraph_wrappedTransferRelations = relations(subgraph_wrappedTransfer, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_wrappedTransfer.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_wrappedTransfer.ownerId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_nameWrappedRelations = relations(subgraph_nameWrapped, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_nameWrapped.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_nameWrapped.ownerId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_nameUnwrappedRelations = relations(subgraph_nameUnwrapped, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_nameUnwrapped.domainId],
    references: [subgraph_domain.id],
  }),
  owner: one(subgraph_account, {
    fields: [subgraph_nameUnwrapped.ownerId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_fusesSetRelations = relations(subgraph_fusesSet, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_fusesSet.domainId],
    references: [subgraph_domain.id],
  }),
}));

export const subgraph_expiryExtendedRelations = relations(subgraph_expiryExtended, ({ one }) => ({
  domain: one(subgraph_domain, {
    fields: [subgraph_expiryExtended.domainId],
    references: [subgraph_domain.id],
  }),
}));

// Registration Event Relations

export const subgraph_nameRegisteredRelations = relations(subgraph_nameRegistered, ({ one }) => ({
  registration: one(subgraph_registration, {
    fields: [subgraph_nameRegistered.registrationId],
    references: [subgraph_registration.id],
  }),
  registrant: one(subgraph_account, {
    fields: [subgraph_nameRegistered.registrantId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_nameRenewedRelations = relations(subgraph_nameRenewed, ({ one }) => ({
  registration: one(subgraph_registration, {
    fields: [subgraph_nameRenewed.registrationId],
    references: [subgraph_registration.id],
  }),
}));

export const subgraph_nameTransferredRelations = relations(subgraph_nameTransferred, ({ one }) => ({
  registration: one(subgraph_registration, {
    fields: [subgraph_nameTransferred.registrationId],
    references: [subgraph_registration.id],
  }),
  newOwner: one(subgraph_account, {
    fields: [subgraph_nameTransferred.newOwnerId],
    references: [subgraph_account.id],
  }),
}));

// Resolver Event Relations

export const subgraph_addrChangedRelations = relations(subgraph_addrChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_addrChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
  addr: one(subgraph_account, {
    fields: [subgraph_addrChanged.addrId],
    references: [subgraph_account.id],
  }),
}));

export const subgraph_multicoinAddrChangedRelations = relations(
  subgraph_multicoinAddrChanged,
  ({ one }) => ({
    resolver: one(subgraph_resolver, {
      fields: [subgraph_multicoinAddrChanged.resolverId],
      references: [subgraph_resolver.id],
    }),
  }),
);

export const subgraph_nameChangedRelations = relations(subgraph_nameChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_nameChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
}));

export const subgraph_abiChangedRelations = relations(subgraph_abiChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_abiChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
}));

export const subgraph_pubkeyChangedRelations = relations(subgraph_pubkeyChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_pubkeyChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
}));

export const subgraph_textChangedRelations = relations(subgraph_textChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_textChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
}));

export const subgraph_contenthashChangedRelations = relations(
  subgraph_contenthashChanged,
  ({ one }) => ({
    resolver: one(subgraph_resolver, {
      fields: [subgraph_contenthashChanged.resolverId],
      references: [subgraph_resolver.id],
    }),
  }),
);

export const subgraph_interfaceChangedRelations = relations(
  subgraph_interfaceChanged,
  ({ one }) => ({
    resolver: one(subgraph_resolver, {
      fields: [subgraph_interfaceChanged.resolverId],
      references: [subgraph_resolver.id],
    }),
  }),
);

export const subgraph_authorisationChangedRelations = relations(
  subgraph_authorisationChanged,
  ({ one }) => ({
    resolver: one(subgraph_resolver, {
      fields: [subgraph_authorisationChanged.resolverId],
      references: [subgraph_resolver.id],
    }),
  }),
);

export const subgraph_versionChangedRelations = relations(subgraph_versionChanged, ({ one }) => ({
  resolver: one(subgraph_resolver, {
    fields: [subgraph_versionChanged.resolverId],
    references: [subgraph_resolver.id],
  }),
}));
