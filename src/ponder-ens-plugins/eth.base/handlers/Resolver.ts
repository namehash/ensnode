import { type Context, type Event, ponder } from "ponder:registry";
import { domains, resolvers } from "ponder:schema";
import { hasNullByte, uniq } from "../../../lib/helpers";
import { makeResolverId } from "../../../lib/ids";
import { upsertAccount, upsertResolver } from "../../../lib/upserts";
import { PonderEnsIndexingHandlerModule } from "../../types";
import { type NsType, ns } from "../ponder.config";

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
  event: Event<NsType<"Resolver:TextChanged">>;
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
  // New registry handlers
  ponder.on(ns("Resolver:AddrChanged"), _handleAddrChanged);
  ponder.on(ns("Resolver:AddressChanged"), _handleAddressChanged);
  ponder.on(ns("Resolver:NameChanged"), _handleNameChanged);
  ponder.on(ns("Resolver:ABIChanged"), _handleABIChanged);
  ponder.on(ns("Resolver:PubkeyChanged"), _handlePubkeyChanged);
  ponder.on(ns("Resolver:TextChanged"), _handleTextChanged);
  ponder.on(ns("Resolver:ContenthashChanged"), _handleContenthashChanged);
  ponder.on(ns("Resolver:InterfaceChanged"), _handleInterfaceChanged);
  ponder.on(ns("Resolver:VersionChanged"), _handleVersionChanged);
  ponder.on(ns("Resolver:DNSRecordChanged"), _handleDNSRecordChanged);
  ponder.on(ns("Resolver:DNSRecordDeleted"), _handleDNSRecordDeleted);
  ponder.on(ns("Resolver:DNSZonehashChanged"), _handleDNSZonehashChanged);

  // FIXME: make sure to use domain name in the indexing handler name
  // ponder.on("eth.base.Resolver:AddrChanged", _handleAddrChanged);
}

export const handlerModule: Readonly<PonderEnsIndexingHandlerModule> = {
  attachHandlers: initResolverHandlers,
};
