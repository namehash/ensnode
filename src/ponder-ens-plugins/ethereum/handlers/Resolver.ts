import { type Context, type Event, ponder } from "ponder:registry";
import { domains, resolvers } from "ponder:schema";
import { hasNullByte, uniq } from "../../../lib/helpers";
import { makeResolverId } from "../../../lib/ids";
import { upsertAccount, upsertResolver } from "../../../lib/upserts";
import { PonderEnsIndexingHandlerModule } from "../../types";

// there is a legacy resolver abi with different TextChanged events.
// luckily the subgraph doesn't care about the value parameter so we can use a union
// to unify the codepath
type AnyTextChangedEvent =
  | Event<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
  | Event<"Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">
  | Event<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)">
  | Event<"OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)">;

async function _handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<"Resolver:AddrChanged">;
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
    await context.db
      .update(domains, { id: node })
      .set({ resolvedAddress: address });
  }

  // TODO: log ResolverEvent
}

async function _handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<"Resolver:AddressChanged">;
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
  event: Event<"Resolver:NameChanged">;
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
  event: Event<"Resolver:ABIChanged">;
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
  event: Event<"Resolver:PubkeyChanged">;
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
  await context.db
    .update(resolvers, { id })
    .set({ texts: uniq([...resolver.texts, key]) });

  // TODO: log ResolverEvent
}

async function _handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<"Resolver:ContenthashChanged">;
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
  event: Event<"Resolver:InterfaceChanged">;
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
  event: Event<"Resolver:AuthorisationChanged">;
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
  event: Event<"Resolver:VersionChanged">;
}) {
  // a version change nulls out the resolver
  const { node } = event.args;
  const id = makeResolverId(node, event.log.address);
  const domain = await context.db.find(domains, { id: node });
  if (!domain) throw new Error("domain expected");

  // materialize the Domain's resolvedAddress field
  if (domain.resolverId === id) {
    await context.db
      .update(domains, { id: node })
      .set({ resolvedAddress: null });
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
  event: Event<"Resolver:DNSRecordChanged">;
}) {
  // subgraph ignores
}

async function _handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: Event<"Resolver:DNSRecordDeleted">;
}) {
  // subgraph ignores
}

async function _handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: Event<"Resolver:DNSZonehashChanged">;
}) {
  // subgraph ignores
}

export function initResolverHandlers() {
  // Old registry handlers
  ponder.on("OldRegistryResolvers:AddrChanged", _handleAddrChanged);
  ponder.on("OldRegistryResolvers:AddressChanged", _handleAddressChanged);
  ponder.on("OldRegistryResolvers:NameChanged", _handleNameChanged);
  ponder.on("OldRegistryResolvers:ABIChanged", _handleABIChanged);
  ponder.on("OldRegistryResolvers:PubkeyChanged", _handlePubkeyChanged);
  ponder.on(
    "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    _handleTextChanged
  );
  ponder.on(
    "OldRegistryResolvers:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    _handleTextChanged
  );
  ponder.on(
    "OldRegistryResolvers:ContenthashChanged",
    _handleContenthashChanged
  );
  ponder.on("OldRegistryResolvers:InterfaceChanged", _handleInterfaceChanged);
  ponder.on(
    "OldRegistryResolvers:AuthorisationChanged",
    _handleAuthorisationChanged
  );
  ponder.on("OldRegistryResolvers:VersionChanged", _handleVersionChanged);
  ponder.on("OldRegistryResolvers:DNSRecordChanged", _handleDNSRecordChanged);
  ponder.on("OldRegistryResolvers:DNSRecordDeleted", _handleDNSRecordDeleted);
  ponder.on(
    "OldRegistryResolvers:DNSZonehashChanged",
    _handleDNSZonehashChanged
  );

  // New registry handlers
  ponder.on("Resolver:AddrChanged", _handleAddrChanged);
  ponder.on("Resolver:AddressChanged", _handleAddressChanged);
  ponder.on("Resolver:NameChanged", _handleNameChanged);
  ponder.on("Resolver:ABIChanged", _handleABIChanged);
  ponder.on("Resolver:PubkeyChanged", _handlePubkeyChanged);
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key)",
    _handleTextChanged
  );
  ponder.on(
    "Resolver:TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)",
    _handleTextChanged
  );
  ponder.on("Resolver:ContenthashChanged", _handleContenthashChanged);
  ponder.on("Resolver:InterfaceChanged", _handleInterfaceChanged);
  ponder.on("Resolver:AuthorisationChanged", _handleAuthorisationChanged);
  ponder.on("Resolver:VersionChanged", _handleVersionChanged);
  ponder.on("Resolver:DNSRecordChanged", _handleDNSRecordChanged);
  ponder.on("Resolver:DNSRecordDeleted", _handleDNSRecordDeleted);
  ponder.on("Resolver:DNSZonehashChanged", _handleDNSZonehashChanged);
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initResolverHandlers,
};
