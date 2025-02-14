import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { ROOT_NODE, makeSubnodeNamehash } from "@ensnode/utils/subname-helpers";
import { type Hex } from "viem";
import { makeRegistryHandlers, setupRootNode } from "../../../handlers/Registry";
import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";

// a domain is migrated iff it exists and isMigrated is set to true, otherwise it is not
async function isDomainMigrated(context: Context, node: Hex) {
  const domain = await context.db.find(schema.domain, { id: node });
  return domain?.isMigrated ?? false;
}

export default function ({ ownedName, namespace }: PonderENSPluginHandlerArgs<"eth">) {
  const {
    handleNewOwner, //
    handleNewResolver,
    handleNewTTL,
    handleTransfer,
  } = makeRegistryHandlers(ownedName);

  ponder.on(namespace("RegistryOld:setup"), setupRootNode);

  // old registry functions are proxied to the current handlers
  // iff the domain has not yet been migrated
  ponder.on(namespace("RegistryOld:NewOwner"), async ({ context, event }) => {
    const node = makeSubnodeNamehash(event.args.node, event.args.label);
    const isMigrated = await isDomainMigrated(context, node);
    if (isMigrated) return;
    return handleNewOwner(false)({ context, event });
  });

  ponder.on(namespace("RegistryOld:NewResolver"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    const isRootNode = event.args.node === ROOT_NODE;

    // inverted logic of https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L246
    // NOTE: the subgraph must include an exception here for the root node because it starts out
    // isMigrated: true, but we definitely still want to handle NewResolver events for it.
    if (isMigrated && !isRootNode) return;
    return handleNewResolver({ context, event });
  });

  ponder.on(namespace("RegistryOld:NewTTL"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleNewTTL({ context, event });
  });

  ponder.on(namespace("RegistryOld:Transfer"), async ({ context, event }) => {
    // NOTE: this logic derived from the subgraph introduces a bug for queries with a blockheight
    // below 9380380, when the new Registry was deployed, as it implicitly ignores Transfer events
    // of the ROOT_NODE. as a result, the root node's owner is always zeroAddress until the new
    // Registry events are picked up. for backwards compatibility this beahvior is re-implemented
    // here.

    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleTransfer({ context, event });
  });

  ponder.on(namespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(namespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(namespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(namespace("Registry:Transfer"), handleTransfer);
}
