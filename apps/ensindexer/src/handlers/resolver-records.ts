import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { ETH_COIN_TYPE, Node } from "@ensnode/utils";
import { type Address } from "viem";

import { makeResolverId, makeResolverRecordId } from "@/lib/ids";
import { hasNullByte } from "@/lib/lib-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

// AddrChanged is just AddressChanged with an implicit coinType of ETH
export async function handleAddrChanged({
  context,
  event,
}: {
  context: Context;
  event: EventWithArgs<{ node: Node; a: Address }>;
}) {
  handleAddressChanged({
    context,
    event: {
      ...event,
      args: {
        node: event.args.node,
        newAddress: event.args.a,
        coinType: ETH_COIN_TYPE,
      },
    },
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
  const resolverId = makeResolverId(context.network.chainId, event.log.address, node);

  const recordId = makeResolverRecordId(resolverId, coinType.toString());

  await context.db
    .insert(schema.ext_resolverAddressRecords)
    // create a new address record entity
    .values({
      id: recordId,
      resolverId,
      coinType,
      address: newAddress,
    })
    // or update the existing one
    .onConflictDoUpdate({ address: newAddress });
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

  // if value is undefined (LegacyPublicResolver), nothing to do
  if (!value) return;

  // if either key or value have null bytes, consider the record unindexable
  // TODO: instead we could sanitize each value with stripNullBytes and store them anyway
  //  but that's not technically correct, so idk
  if (hasNullByte(key) || hasNullByte(value)) return;

  const resolverId = makeResolverId(context.network.chainId, event.log.address, node);

  const recordId = makeResolverRecordId(resolverId, key);

  await context.db
    .insert(schema.ext_resolverTextRecords)
    // create a new text record entity
    .values({
      id: recordId,
      resolverId,
      key,
      value,
    })
    // or update the existing one
    .onConflictDoUpdate({ value });
}
