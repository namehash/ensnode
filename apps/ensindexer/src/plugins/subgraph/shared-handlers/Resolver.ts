import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { Node, uniq } from "@ensnode/ensnode-sdk";
import { type Address, Hash, type Hex } from "viem";

import config from "@/config";
import { parseDnsTxtRecordArgs } from "@/lib/dns-helpers";
import { hasNullByte, stripNullBytes } from "@/lib/lib-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { sharedEventValues, upsertAccount, upsertResolver } from "@/lib/subgraph/db-helpers";
import { makeResolverId } from "@/lib/subgraph/ids";

/**
 * These functions describe the shared indexing behavior for Resolver functions across all indexed
 * chains, compatible with subgraph indexing semantics.
 *
 * NOTE: The indexing logic in this file must use upserts because a 'Resolver' can be _any_
 * contract that emits events with the relevant signatures. The contract may not necessarily be
 * intended for use with ENS as a Resolver. Each indexed event could be the first one indexed for
 * a contract and its Resolver ID, so we cannot assume the Resolver entity already exists.
 */

export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; a: Address }>;
}) {
  const { a: address, node } = event.args;
  await upsertAccount(context, address);

  const id = makeResolverId(context.chain.id, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    addrId: address,
  });

  // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
  const domain = await context.db.find(schema.subgraph_domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db
      .update(schema.subgraph_domain, { id: node })
      .set({ resolvedAddressId: address });
  }

  // log ResolverEvent
  await context.db.insert(schema.subgraph_addrChanged).values({
    ...sharedEventValues(context.chain.id, event),
    resolverId: id,
    addrId: address,
  });
}

export async function handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; coinType: bigint; newAddress: Address }>;
}) {
  const { node, coinType, newAddress } = event.args;

  const id = makeResolverId(context.chain.id, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert the new coinType
  await context.db
    .update(schema.subgraph_resolver, { id })
    .set({ coinTypes: uniq([...(resolver.coinTypes ?? []), coinType]) });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_multicoinAddrChanged).values({
    ...sharedEventValues(context.chain.id, event),
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

  const id = makeResolverId(context.chain.id, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_nameChanged).values({
    ...sharedEventValues(context.chain.id, event),
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

  const id = makeResolverId(context.chain.id, event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_abiChanged).values({
    ...sharedEventValues(context.chain.id, event),
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
  const id = makeResolverId(context.chain.id, event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_pubkeyChanged).values({
    ...sharedEventValues(context.chain.id, event),
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
  const id = makeResolverId(context.chain.id, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // NOTE(subgraph-compat): subgraph implicitly strips null bytes from event args
  const sanitizedKey = stripNullBytes(key);

  // NOTE(subgraph-compat): value can be undefined in the case of a LegacyPublicResolver (DefaultPublicResolver1)
  // event, and the subgraph indexes that as `null`. value can also be decoded to empty string, which
  // the subgraph also indexes as `null`.
  // ex: https://etherscan.io/tx/0x7fac4f1802c9b1969311be0412e6f900d531c59155421ff8ce1fda78b87956d0#eventlog
  //
  // NOTE(subgraph-compat): we also must strip null bytes in strings, which are unindexable by Postgres
  // ex: https://etherscan.io/tx/0x2eb93d872a8f3e4295ea50773c3816dcaea2541f202f650948e8d6efdcbf4599#eventlog
  const sanitizedValue = value === undefined ? null : stripNullBytes(value) || null;

  // upsert new key
  // NOTE(subgraph-compat): we insert sanitized key even if it's empty string to match subgraph behavior
  // of implicitly stripping null bytes
  await context.db
    .update(schema.subgraph_resolver, { id })
    .set({ texts: uniq([...(resolver.texts ?? []), sanitizedKey]) });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_textChanged).values({
    ...sharedEventValues(context.chain.id, event),
    resolverId: id,
    key: sanitizedKey,
    value: sanitizedValue,
  });
}

export async function handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; hash: Hash }>;
}) {
  const { node, hash } = event.args;
  const id = makeResolverId(context.chain.id, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    contentHash: hash,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_contenthashChanged).values({
    ...sharedEventValues(context.chain.id, event),
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
  const id = makeResolverId(context.chain.id, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_interfaceChanged).values({
    ...sharedEventValues(context.chain.id, event),
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
    owner: Address;
    target: Hex;
    isAuthorised: boolean;
  }>;
}) {
  const { node, owner, target, isAuthorised } = event.args;
  const id = makeResolverId(context.chain.id, event.log.address, node);

  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_authorisationChanged).values({
    ...sharedEventValues(context.chain.id, event),
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
  const { node, newVersion } = event.args;
  const id = makeResolverId(context.chain.id, event.log.address, node);

  // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
  const domain = await context.db.find(schema.subgraph_domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(schema.subgraph_domain, { id: node }).set({ resolvedAddressId: null });
  }

  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,

    // clear out the resolver's info on VersionChanged
    addrId: null,
    contentHash: null,
    coinTypes: null,
    texts: null,
  });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_versionChanged).values({
    ...sharedEventValues(context.chain.id, event),
    resolverId: id,
    version: newVersion,
  });
}

/**
 * Handles both ens-contracts' IDNSRecordResolver#DNSRecordChanged AND 3DNS' Resolver#DNSRecordChanged
 */
export async function handleDNSRecordChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Node;
    name: Hex;
    resource: number;
    // 3DNS includes a `ttl` in its event ABI for DNSRecordChanged, but
    // ens-contracts's IDNSRecordResolver#DNSRecordChanged does not. In this current indexing
    // logic, the concept of ttl is not used, so we define it here for completness but otherwise
    // ignore it.
    ttl?: number;
    record: Hex;
  }>;
}) {
  // subgraph explicitly ignores this event
  if (config.isSubgraphCompatible) return;

  // but for non-subgraph plugins, we parse the RR set data for relevant records
  const { node } = event.args;
  const { key, value } = parseDnsTxtRecordArgs(event.args);

  // no key to operate over? no-op
  if (key === null) return;

  // upsert Resolver entity
  const id = makeResolverId(context.chain.id, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db
    .update(schema.subgraph_resolver, { id })
    .set({ texts: uniq([...(resolver.texts ?? []), key]) });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_textChanged).values({
    ...sharedEventValues(context.chain.id, event),
    resolverId: id,
    key,
    value,
  });
}

export async function handleDNSRecordDeleted({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Node;
    name: Hex;
    resource: number;
  }>;
}) {
  // subgraph explicitly ignores this event
  if (config.isSubgraphCompatible) return;

  const { node } = event.args;
  const { key } = parseDnsTxtRecordArgs(event.args);

  // no key to operate over? no-op
  if (key === null) return;

  // upsert Resolver entity
  const id = makeResolverId(context.chain.id, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // remove relevant key
  await context.db
    .update(schema.subgraph_resolver, { id })
    .set({ texts: (resolver.texts ?? []).filter((text) => text !== key) });

  // log ResolverEvent
  await context.db.insert(schema.subgraph_textChanged).values({
    ...sharedEventValues(context.chain.id, event),
    resolverId: id,
    key,
    value: null,
  });
}

export async function handleDNSZonehashChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; zonehash: Hash }>;
}) {
  // explicitly ignored / not implemented
}

export async function handleZoneCreated({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; version: bigint }>;
}) {
  // explicitly ignored / not implemented
}
