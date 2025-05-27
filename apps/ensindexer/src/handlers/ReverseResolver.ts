import { type Context } from "ponder:registry";
import { ETH_COIN_TYPE, Node } from "@ensnode/utils";
import { type Address, type Hex } from "viem";

import config from "@/config";
import { upsertAccount, upsertResolver } from "@/lib/db-helpers";
import { parseDnsTxtRecordArgs } from "@/lib/dns-helpers";
import { makeResolverId } from "@/lib/ids";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import {
  handleResolverAddressRecordUpdate,
  handleResolverNameUpdate,
  handleResolverTextRecordUpdate,
} from "@/lib/resolver-records-helpers";

/**
 * These are ReverseResolver-specific handler functions. They're stripped-down versions of the
 * normal Resolver handlers (which will get run for any Resolvers used as Reverse Resolvers as well).
 *
 * They specifically:
 * 1) upsert the Account and Resolver entities, and
 * 2) index the relevant Resolver records emitted by these events.
 *
 * They avoid inserting events, as that's handled by the multi-network Resolver handlers if a plugin
 * activates them.
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

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    // AddrChanged is just AddressChanged with implicit coinType of ETH
    await handleResolverAddressRecordUpdate(context, id, BigInt(ETH_COIN_TYPE), event.args.a);
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
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    await handleResolverAddressRecordUpdate(context, id, coinType, newAddress);
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

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    await handleResolverNameUpdate(context, id, name);
  }
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
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    await handleResolverTextRecordUpdate(context, id, key, value);
  }
}

export async function handleDNSRecordChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{
    node: Node;
    name: Hex;
    resource: number;
    ttl?: number;
    record: Hex;
  }>;
}) {
  const { node } = event.args;
  const { key, value } = parseDnsTxtRecordArgs(event.args);

  // no key to operate over? no-op
  if (!key) return;

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    await handleResolverTextRecordUpdate(context, id, key, value);
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
  const { node } = event.args;

  const { key } = parseDnsTxtRecordArgs(event.args);

  // no key to operate over? no-op
  if (!key) return;

  const id = makeResolverId(context.network.chainId, event.log.address, node);
  await upsertResolver(context, {
    id,
    domainId: node,
    address: event.log.address,
  });

  if (config.indexResolverRecords) {
    await handleResolverTextRecordUpdate(context, id, key, null);
  }
}
