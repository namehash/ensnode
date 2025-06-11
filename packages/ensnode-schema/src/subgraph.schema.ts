import { index, onchainTable, relations } from "ponder";
import type { Address } from "viem";
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

    // NOTE(resolver-records): include the value of the reverse-resolution name() record
    // https://docs.ens.domains/ensip/3
    name: t.text(),
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
    domainId: t.hex().notNull(),
    // The registration date of the domain
    registrationDate: t.bigint().notNull(),
    // The expiry date of the domain
    expiryDate: t.bigint().notNull(),
    // The cost associated with the domain registration
    cost: t.bigint(),
    // The account that registered the domain
    registrantId: t.hex().notNull(),
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
    domainId: t.hex().notNull(),
    // The expiry date of the wrapped domain
    expiryDate: t.bigint().notNull(),
    // The number of fuses remaining on the wrapped domain
    fuses: t.integer().notNull(),
    // The account that owns this WrappedDomain
    ownerId: t.hex().notNull(),
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

export const transfer = onchainTable(
  "transfers",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const newOwner = onchainTable(
  "new_owners",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
    parentDomainId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const newResolver = onchainTable(
  "new_resolvers",
  (t) => ({
    ...domainEvent(t),
    resolverId: t.text().notNull(),
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
    ownerId: t.hex().notNull(),
  }),
  domainEventIndex,
);

export const nameWrapped = onchainTable(
  "name_wrapped",
  (t) => ({
    ...domainEvent(t),
    name: t.text(),
    fuses: t.integer().notNull(),
    ownerId: t.hex().notNull(),
    expiryDate: t.bigint().notNull(),
  }),
  domainEventIndex,
);

export const nameUnwrapped = onchainTable(
  "name_unwrapped",
  (t) => ({
    ...domainEvent(t),
    ownerId: t.hex().notNull(),
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

export const nameRegistered = onchainTable(
  "name_registered",
  (t) => ({
    ...registrationEvent(t),
    registrantId: t.hex().notNull(),
    expiryDate: t.bigint().notNull(),
  }),
  registrationEventIndex,
);

export const nameRenewed = onchainTable(
  "name_renewed",
  (t) => ({
    ...registrationEvent(t),
    expiryDate: t.bigint().notNull(),
  }),
  registrationEventIndex,
);

export const nameTransferred = onchainTable(
  "name_transferred",
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

export const addrChanged = onchainTable(
  "addr_changed",
  (t) => ({
    ...resolverEvent(t),
    addrId: t.hex().notNull(),
  }),
  resolverEventIndex,
);

export const multicoinAddrChanged = onchainTable(
  "multicoin_addr_changed",
  (t) => ({
    ...resolverEvent(t),
    coinType: t.bigint().notNull(),
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
    contentType: t.bigint().notNull(),
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
    interfaceID: t.hex().notNull(),
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
    isAuthorized: t.boolean().notNull(),
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
