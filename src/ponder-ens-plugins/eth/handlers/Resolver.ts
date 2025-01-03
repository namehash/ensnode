import { type Context, type Event, ponder } from "ponder:registry";
import { domains, resolvers } from "ponder:schema";
import { hasNullByte, uniq } from "../../../lib/helpers";
import { makeResolverId } from "../../../lib/ids";
import { upsertAccount, upsertResolver } from "../../../lib/upserts";
import { PonderEnsIndexingHandlerModule } from "../../types";
import { type NsType, ns } from "../ponder.config";

// there is a legacy resolver abi with different TextChanged events.
// luckily the subgraph doesn't care about the value parameter so we can use a union
// to unify the codepath
type AnyTextChangedEvent =
  | Event<
      NsType<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
    >
  | Event<
      NsType<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">
    >
  | Event<
      NsType<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
    >
  | Event<
      NsType<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">
    >;

async function _handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AddrChanged">>;
}) {
  const { a: address, node } = event.args;
  await upsertAccount(context, address);

  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    addrId: address,
  });

  // materialize the resolved add to the domain iff this resolver is active
  const domain = await context.db.find(domains, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(domains, { id: node }).set({ resolvedAddress: address });
  }

  // TODO: log ResolverEvent
}

async function _handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AddressChanged">>;
}) {
  const { node, coinType, newAddress } = event.args;
  await upsertAccount(context, newAddress);

  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert the new coinType
  await context.db
    .update(resolvers, { id })
    .set({ coinTypes: uniq([...resolver.coinTypes, coinType]) });

  // TODO: log ResolverEvent
}

async function _handleNameChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:NameChanged">>;
}) {
  const { node, name } = event.args;
  if (hasNullByte(name)) return;

  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

async function _handleABIChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:ABIChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

async function _handlePubkeyChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:PubkeyChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

async function _handleTextChanged({
  context,
  event,
}: {
  context: Context;
  event: AnyTextChangedEvent;
}) {
  const { node, key } = event.args;
  const id = makeResolverId(node, event.log.address);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db.update(resolvers, { id }).set({ texts: uniq([...resolver.texts, key]) });

  // TODO: log ResolverEvent
}

async function _handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:ContenthashChanged">>;
}) {
  const { node, hash } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    contentHash: hash,
  });

  // TODO: log ResolverEvent
}

async function _handleInterfaceChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:InterfaceChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

async function _handleAuthorisationChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:AuthorisationChanged">>;
}) {
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // TODO: log ResolverEvent
}

async function _handleVersionChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:VersionChanged">>;
}) {
  // a version change nulls out the resolver
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const domain = await context.db.find(domains, { id: node });
  if (!domain) throw new Error("domain expected");

  // materialize the Domain's resolvedAddress field
  if (domain.resolverId === id) {
    await context.db.update(domains, { id: node }).set({ resolvedAddress: null });
  }

  // clear out the resolver's info
  await context.db.update(resolvers, { id }).set({
    addrId: null,
    contentHash: null,
    coinTypes: [],
    texts: [],
  });

  // TODO: log ResolverEvent
}

async function _handleDNSRecordChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSRecordChanged">>;
}) {
  // subgraph ignores
}

async function _handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSRecordDeleted">>;
}) {
  // subgraph ignores
}

async function _handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<NsType<"Resolver:DNSZonehashChanged">>;
}) {
  // subgraph ignores
}

export function initResolverHandlers() {
  // Old registry handlers
  ponder.on(ns("OldRegistryResolvers:AddrChanged"), _handleAddrChanged);
  ponder.on(ns("OldRegistryResolvers:AddressChanged"), _handleAddressChanged);
  ponder.on(ns("OldRegistryResolvers:NameChanged"), _handleNameChanged);
  ponder.on(ns("OldRegistryResolvers:ABIChanged"), _handleABIChanged);
  ponder.on(ns("OldRegistryResolvers:PubkeyChanged"), _handlePubkeyChanged);
  ponder.on(
    ns(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    ),
    _handleTextChanged,
  );
  ponder.on(
    ns(
      "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    _handleTextChanged,
  );
  ponder.on(ns("OldRegistryResolvers:ContenthashChanged"), _handleContenthashChanged);
  ponder.on(ns("OldRegistryResolvers:InterfaceChanged"), _handleInterfaceChanged);
  ponder.on(ns("OldRegistryResolvers:AuthorisationChanged"), _handleAuthorisationChanged);
  ponder.on(ns("OldRegistryResolvers:VersionChanged"), _handleVersionChanged);
  ponder.on(ns("OldRegistryResolvers:DNSRecordChanged"), _handleDNSRecordChanged);
  ponder.on(ns("OldRegistryResolvers:DNSRecordDeleted"), _handleDNSRecordDeleted);
  ponder.on(ns("OldRegistryResolvers:DNSZonehashChanged"), _handleDNSZonehashChanged);

  // New registry handlers
  ponder.on(ns("Resolver:AddrChanged"), _handleAddrChanged);
  ponder.on(ns("Resolver:AddressChanged"), _handleAddressChanged);
  ponder.on(ns("Resolver:NameChanged"), _handleNameChanged);
  ponder.on(ns("Resolver:ABIChanged"), _handleABIChanged);
  ponder.on(ns("Resolver:PubkeyChanged"), _handlePubkeyChanged);
  ponder.on(
    ns("Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)"),
    _handleTextChanged,
  );
  ponder.on(
    ns(
      "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    ),
    _handleTextChanged,
  );
  ponder.on(ns("Resolver:ContenthashChanged"), _handleContenthashChanged);
  ponder.on(ns("Resolver:InterfaceChanged"), _handleInterfaceChanged);
  ponder.on(ns("Resolver:AuthorisationChanged"), _handleAuthorisationChanged);
  ponder.on(ns("Resolver:VersionChanged"), _handleVersionChanged);
  ponder.on(ns("Resolver:DNSRecordChanged"), _handleDNSRecordChanged);
  ponder.on(ns("Resolver:DNSRecordDeleted"), _handleDNSRecordDeleted);
  ponder.on(ns("Resolver:DNSZonehashChanged"), _handleDNSZonehashChanged);
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initResolverHandlers,
};
