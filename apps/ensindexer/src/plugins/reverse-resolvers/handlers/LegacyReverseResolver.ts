import { ponder } from "ponder:registry";

import { upsertResolver } from "@/lib/db-helpers";
import { makeResolverId } from "@/lib/ids";
import { handleResolverNameUpdate } from "@/lib/resolver-records-helpers";

/**
 * Handlers for pre-ENSIP-19 ReverseResolver contracts. Their purpose is to index
 * just the `name` records, in order to power Protocol Acceleration for ENSIP-19 L2 Primary Names.
 *
 * It specifically:
 * 1) upserts Resolver entities, and
 * 2) indexes the `name` record emitted by `NameChanged`.
 *
 * Note that this handler _doesn't_ need to:
 * 1) upsert Account entities, or
 * 2) insert Resolver events,
 * as those actions are performed by the standard Resolver handlers (which will also run for the
 * specified events on this contract, if the user has enabled a plugin that registers them,
 * since this Contract is also a Resolver).
 */
export default function () {
  ponder.on("LegacyReverseResolver:NameChanged", async ({ context, event }) => {
    const { node, name } = event.args;

    const id = makeResolverId(context.chain.id, event.log.address, node);
    await upsertResolver(context, {
      id,
      domainId: node,
      address: event.log.address,
    });

    await handleResolverNameUpdate(context, id, name);
  });
}
