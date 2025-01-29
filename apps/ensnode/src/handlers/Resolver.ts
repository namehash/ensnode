import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import type { Node } from "ensnode-utils/types";
import { Hex } from "viem";
import { sharedEventValues, upsertAccount, upsertResolver } from "../lib/db-helpers";
import { hasNullByte, uniq } from "../lib/helpers";
import { makeResolverId } from "../lib/ids";
import { EventWithArgs } from "../lib/ponder-helpers";

// NOTE: both subgraph and this indexer use upserts in this file because a 'Resolver' is _any_
// contract on the chain that emits an event with this signature, which may or may not actually be
// a contract intended for use with ENS as a Resolver. because of this, each event could be the
// first event the indexer has seen for this contract (and its Resolver id) and therefore needs not
// assume a Resolver entity already exists

export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; a: Hex }>;
}) {
  const { a: address, node } = event.args;
  await upsertAccount(context, address);

  const id = makeResolverId(event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    addrId: address,
  });

  // materialize the resolved addr to the domain iff this resolver is active
  const domain = await context.db.find(schema.domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: address });
  }

  // log ResolverEvent
  await context.db.insert(schema.addrChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    addrId: address,
  });
}

export async function handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; coinType: bigint; newAddress: Hex }>;
}) {
  const { node, coinType, newAddress } = event.args;

  const id = makeResolverId(event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert the new coinType
  await context.db
    .update(schema.resolver, { id })
    .set({ coinTypes: uniq([...(resolver.coinTypes ?? []), coinType]) });

  // log ResolverEvent
  await context.db.insert(schema.multicoinAddrChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    coinType,
    addr: newAddress,
  });
}

export async function handleNameChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; name: string }>;
}) {
  const { node, name } = event.args;
  if (hasNullByte(name)) return;

  const id = makeResolverId(event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.nameChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    name,
  });
}

export async function handleABIChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; contentType: bigint }>;
}) {
  const { node, contentType } = event.args;
  const id = makeResolverId(event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.abiChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    contentType,
  });
}

export async function handlePubkeyChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; x: Hex; y: Hex }>;
}) {
  const { node, x, y } = event.args;
  const id = makeResolverId(event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.pubkeyChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    x,
    y,
  });
}

export async function handleTextChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Node;
    indexedKey: string;
    key: string;
    value?: string;
  }>;
}) {
  const { node, key, value } = event.args;
  const id = makeResolverId(event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db
    .update(schema.resolver, { id })
    .set({ texts: uniq([...(resolver.texts ?? []), key]) });

  // log ResolverEvent
  await context.db.insert(schema.textChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    key,
    value,
  });
}

export async function handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; hash: Hex }>;
}) {
  const { node, hash } = event.args;
  const id = makeResolverId(event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    contentHash: hash,
  });

  // log ResolverEvent
  await context.db.insert(schema.contenthashChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    hash,
  });
}

export async function handleInterfaceChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; interfaceID: Hex; implementer: Hex }>;
}) {
  const { node, interfaceID, implementer } = event.args;
  const id = makeResolverId(event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.interfaceChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    interfaceID,
    implementer,
  });
}

export async function handleAuthorisationChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Node;
    owner: Hex;
    target: Hex;
    isAuthorised: boolean;
  }>;
}) {
  const { node, owner, target, isAuthorised } = event.args;
  const id = makeResolverId(event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.authorisationChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    owner,
    target,
    // NOTE: the spelling difference is kept for subgraph backwards-compatibility
    isAuthorized: isAuthorised,
  });
}

export async function handleVersionChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; newVersion: bigint }>;
}) {
  // a version change nulls out the resolver
  const { node, newVersion } = event.args;
  const id = makeResolverId(event.log.address, node);
  const domain = await context.db.find(schema.domain, { id: node });

  // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
  if (domain && domain.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: null });
  }

  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,

    // clear out the resolver's info
    addrId: null,
    contentHash: null,
    coinTypes: null,
    texts: null,
  });

  // log ResolverEvent
  await context.db.insert(schema.versionChanged).values({
    ...sharedEventValues(event),
    resolverId: id,
    version: newVersion,
  });
}

export async function handleDNSRecordChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Hex;
    name: Hex;
    resource: number;
    record: Hex;
  }>;
}) {
  // subgraph ignores
}

export async function handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Hex;
    name: Hex;
    resource: number;
    record?: Hex;
  }>;
}) {
  // subgraph ignores
}

export async function handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Hex; zonehash: Hex }>;
}) {
  // subgraph ignores
}
