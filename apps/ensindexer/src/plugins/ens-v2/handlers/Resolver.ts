import { Context, ponder } from "ponder:registry";
import schema from "ponder:schema";

import { Node } from "@ensnode/utils/types";
import { Address } from "viem";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { EventWithArgs } from "../../../lib/ponder-helpers";
import { makeContractId, makeResolverRecordsAddressId, makeResolverRecordsId } from "../v2-lib";

export async function upsertResolver(
  context: Context,
  values: typeof schema.v2_resolver.$inferInsert,
) {
  return context.db.insert(schema.v2_resolver).values(values).onConflictDoUpdate(values);
}

export async function upsertResolverRecords(
  context: Context,
  values: typeof schema.v2_resolverRecords.$inferInsert,
) {
  return context.db.insert(schema.v2_resolverRecords).values(values).onConflictDoUpdate(values);
}

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  async function handleAddressChanged({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      node: Node;
      coinType: bigint;
      newAddress: Address;
    }>;
  }) {
    const { node, coinType, newAddress } = event.args;

    const resolverId = makeContractId(context.network.chainId, event.log.address);
    const resolverRecordsId = makeResolverRecordsId(resolverId, node);
    const resolverRecordsAddressId = makeResolverRecordsAddressId(resolverRecordsId, coinType);

    await upsertResolver(context, { id: resolverId });
    await upsertResolverRecords(context, { id: resolverRecordsId, resolverId, node });

    await context.db
      .insert(schema.v2_resolverRecordsAddress)
      // create a new address entity
      .values({
        id: resolverRecordsAddressId,
        resolverRecordsId,
        coinType,
        address: newAddress,
      })
      // or update the existing one
      .onConflictDoUpdate({ address: newAddress });
  }

  ponder.on(namespace("Resolver:AddrChanged"), async ({ context, event }) => {
    await handleAddressChanged({
      context,
      event: {
        ...event,
        args: {
          node: event.args.node,
          newAddress: event.args.a,
          coinType: 60n, // TODO: move to utils/constants
        },
      },
    });
  });

  ponder.on(namespace("Resolver:AddressChanged"), handleAddressChanged);
}
