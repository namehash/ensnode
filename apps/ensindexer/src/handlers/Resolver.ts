import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { ETH_COIN_TYPE, Node } from "@ensnode/ensnode-sdk";
import { type Address, Hash, type Hex, hexToBytes, isAddress, zeroAddress } from "viem";

import config from "@/config";
import { sharedEventValues, upsertAccount, upsertResolver } from "@/lib/db-helpers";
import { decodeDNSPacketBytes, decodeTXTData, parseRRSet } from "@/lib/dns-helpers";
import { makeKeyedResolverRecordId, makeResolverId } from "@/lib/ids";
import { hasNullByte, stripNullBytes, uniq } from "@/lib/lib-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

/**
 * These functions describe the shared indexing behavior for Resolver functions across all indexed
 * chains, compatible with subgraph indexing semantics.
 *
 * NOTE: The indexing logic in this file must use upserts because a 'Resolver' can be _any_
 * contract that emits events with the relevant signatures. The contract may not necessarily be
 * intended for use with ENS as a Resolver. Each indexed event could be the first one indexed for
 * a contract and its Resolver ID, so we cannot assume the Resolver entity already exists.
 */

async function handleAddressRecordUpdate(
  context: Context,
  resolverId: string,
  coinType: bigint,
  address: Address,
) {
  const recordId = makeKeyedResolverRecordId(resolverId, coinType.toString());
  const isDeletion = !isAddress(address) || address === zeroAddress;
  if (isDeletion) {
    // delete
    await context.db.delete(schema.ext_resolverTextRecords, { id: recordId });
  } else {
    // upsert
    await context.db
      .insert(schema.ext_resolverAddressRecords)
      // create a new address record entity
      .values({
        id: recordId,
        resolverId,
        coinType,
        address,
      })
      // or update the existing one
      .onConflictDoUpdate({ address });
  }
}

export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; a: Address }>;
}) {
  const { a: address, node } = event.args;
  await upsertAccount(context, address);

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    addrId: address,
  });

  // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
  const domain = await context.db.find(schema.domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: address });
  }

  // log ResolverEvent
  await context.db.insert(schema.addrChanged).values({
    ...sharedEventValues(context.network.chainId, event),
    resolverId: id,
    addrId: address,
  });

  if (config.indexAdditionalResolverRecords) {
    // AddrChanged is just AddressChanged with implicit coinType of ETH
    await handleAddressRecordUpdate(context, id, ETH_COIN_TYPE, event.args.a);
  }
}

export async function handleAddressChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; coinType: bigint; newAddress: Address }>;
}) {
  const { node, coinType, newAddress } = event.args;

  const id = makeResolverId(context.network.chainId, event.log.address, node);
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
    ...sharedEventValues(context.network.chainId, event),
    resolverId: id,
    coinType,
    addr: newAddress,
  });

  if (config.indexAdditionalResolverRecords) {
    await handleAddressRecordUpdate(context, id, event.args.coinType, event.args.newAddress);
  }
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

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.nameChanged).values({
    ...sharedEventValues(context.network.chainId, event),
    resolverId: id,
    name,
  });

  if (config.indexAdditionalResolverRecords) {
    await upsertResolver(context, {
      id,
      domainId: node,
      address: event.log.address,

      name: name || null, // coalesce falsy value into null
    });
  }

  // TODO: materialize primaryName record iff this Resolver is a known reverse Resolver
  // and scope writes by this network's assigned coinType
  // don't forget to coalesce falsy values into null
}

export async function handleABIChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; contentType: bigint }>;
}) {
  const { node, contentType } = event.args;

  const id = makeResolverId(context.network.chainId, event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.abiChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const id = makeResolverId(context.network.chainId, event.log.address, node);

  // upsert resolver
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.pubkeyChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const id = makeResolverId(context.network.chainId, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // upsert new key
  await context.db
    .update(schema.resolver, { id })
    .set({ texts: uniq([...(resolver.texts ?? []), key]) });

  // NOTE: value can be undefined in the case of a LegacyPublicResolver event, and the subgraph
  // indexes that as `null`.
  //
  // NOTE: ponder's (viem's) event parsing produces empty string for some TextChanged events
  // (which is correct) but the subgraph records null for these instances, so we coalesce
  // falsy strings to null for compatibility
  // ex: https://etherscan.io/tx/0x7fac4f1802c9b1969311be0412e6f900d531c59155421ff8ce1fda78b87956d0#eventlog
  //
  // NOTE: we also must strip null bytes in strings, which are unindexable by Postgres
  // ex: https://etherscan.io/tx/0x2eb93d872a8f3e4295ea50773c3816dcaea2541f202f650948e8d6efdcbf4599#eventlog
  const sanitizedValue = value === undefined ? null : stripNullBytes(value) || null;

  // log ResolverEvent
  await context.db.insert(schema.textChanged).values({
    ...sharedEventValues(context.network.chainId, event),
    resolverId: id,
    key,
    value: sanitizedValue,
  });

  if (config.indexAdditionalResolverRecords) {
    // if value is undefined, this is a LegacyPublicResolver event, nothing to do
    if (value === undefined) return;

    const recordId = makeKeyedResolverRecordId(id, key);

    // consider this a deletion iff value is exactly empty string
    const isDeletion = value === "";
    if (isDeletion) {
      // delete
      await context.db.delete(schema.ext_resolverTextRecords, { id: recordId });
    } else {
      // upsert

      // if no sanitized value to index, don't create a record
      // TODO: represent null bytes correctly or stripNullBytes and store them anyway
      //  but that's not technically correct, so idk
      if (!sanitizedValue) return;

      await context.db
        .insert(schema.ext_resolverTextRecords)
        // create a new text record entity
        .values({
          id: recordId,
          resolverId: id,
          key,
          value: sanitizedValue,
        })
        // or update the existing one
        .onConflictDoUpdate({ value: sanitizedValue });
    }
  }
}

export async function handleContenthashChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; hash: Hash }>;
}) {
  const { node, hash } = event.args;
  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
    contentHash: hash,
  });

  // log ResolverEvent
  await context.db.insert(schema.contenthashChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.interfaceChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const id = makeResolverId(context.network.chainId, event.log.address, node);

  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // log ResolverEvent
  await context.db.insert(schema.authorisationChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const id = makeResolverId(context.network.chainId, event.log.address, node);

  // materialize the Domain's resolvedAddress field iff exists and is set to this Resolver
  const domain = await context.db.find(schema.domain, { id: node });
  if (domain?.resolverId === id) {
    await context.db.update(schema.domain, { id: node }).set({ resolvedAddressId: null });
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
  await context.db.insert(schema.versionChanged).values({
    ...sharedEventValues(context.network.chainId, event),
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
  const { node, name, resource, record } = event.args;

  // we only index TXT records (resource id 16)
  if (resource !== 16) return;

  // parse the record's name, which is the key of the DNS record
  const [, recordName] = decodeDNSPacketBytes(hexToBytes(name));

  // invariant: recordName is always available and parsed correctly
  if (!recordName) throw new Error(`Invalid DNSPacket, cannot parse name '${name}'.`);

  // relevant keys end with .ens
  if (!recordName.endsWith(".ens")) return;

  // trim the .ens off the end to match ENS record naming
  const key = recordName.slice(0, -4);

  // upsert Resolver entity
  const id = makeResolverId(context.network.chainId, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // parse the `record` parameter, which is an RRSet describing the value of the DNS record
  const answers = parseRRSet(record);
  for (const answer of answers) {
    switch (answer.type) {
      case "TXT": {
        // > When decoding, the return value will always be an array of Buffer.
        // https://github.com/mafintosh/dns-packet
        const value = decodeTXTData(answer.data as Buffer[]);

        // note: sanitize value, see `handleTextChanged` for context
        const sanitizedValue = !value ? null : stripNullBytes(value) || null;

        // upsert new key
        await context.db
          .update(schema.resolver, { id })
          .set({ texts: uniq([...(resolver.texts ?? []), key]) });

        // log ResolverEvent
        await context.db.insert(schema.textChanged).values({
          ...sharedEventValues(context.network.chainId, event),
          resolverId: id,
          key,
          value: sanitizedValue,
        });

        if (config.indexAdditionalResolverRecords) {
          // no sanitized value to index? bail
          if (sanitizedValue === null) break;

          const recordId = makeKeyedResolverRecordId(id, key);
          await context.db
            .insert(schema.ext_resolverTextRecords)
            // create a new text record entity
            .values({
              id: recordId,
              resolverId: id,
              key,
              value: sanitizedValue,
            })
            // or update the existing one
            .onConflictDoUpdate({ value: sanitizedValue });
        }
        break;
      }
      default: {
        // no-op unhandled records
        // NOTE: should never occur due to resource id check above
        console.warn(
          `Invariant: received answer ${JSON.stringify(answer)} that is not type === TXT despite resource === 16 check!`,
        );
        break;
      }
    }
  }
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

  const { node, name, resource } = event.args;

  // we only index TXT records (resource id 16)
  if (resource !== 16) return;

  // parse the record's name, which is the key of the DNS record
  const [, recordName] = decodeDNSPacketBytes(hexToBytes(name));

  // invariant: recordName is always available and parsed correctly
  if (!recordName) throw new Error(`Invalid DNSPacket, cannot parse name '${name}'.`);

  // relevant keys end with .ens
  if (!recordName.endsWith(".ens")) return;

  // trim the .ens off the end to match ENS record naming
  const key = recordName.slice(0, -4);

  // upsert Resolver entity
  const id = makeResolverId(context.network.chainId, event.log.address, node);
  const resolver = await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  // remove relevant key
  await context.db
    .update(schema.resolver, { id })
    .set({ texts: (resolver.texts ?? []).filter((text) => text !== key) });

  // log ResolverEvent
  await context.db.insert(schema.textChanged).values({
    ...sharedEventValues(context.network.chainId, event),
    resolverId: id,
    key,
    value: null,
  });

  if (config.indexAdditionalResolverRecords) {
    const recordId = makeKeyedResolverRecordId(id, key);
    await context.db.delete(schema.ext_resolverTextRecords, { id: recordId });
  }
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
