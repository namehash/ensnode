import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Hex } from "viem";
import {
  handleNewOwner,
  handleNewResolver,
  handleNewTTL,
  handleTransfer,
  setupRootNode,
} from "../../../handlers/Registry";
import { makeSubnodeNamehash } from "../../../lib/subname-helpers";
import { pluginNamespace } from "../ponder.config";

// a domain is migrated iff it exists and isMigrated is set to true, otherwise it is not
async function isDomainMigrated(context: Context, node: Hex) {
  const domain = await context.db.find(schema.domain, { id: node });
  return domain?.isMigrated ?? false;
}

export default function () {
  ponder.on(pluginNamespace("RegistryOld:setup"), setupRootNode);

  // old registry functions are proxied to the current handlers
  // iff the domain has not yet been migrated
  ponder.on(pluginNamespace("RegistryOld:NewOwner"), async ({ context, event }) => {
    const node = makeSubnodeNamehash(event.args.node, event.args.label);
    const isMigrated = await isDomainMigrated(context, node);
    if (isMigrated) return;
    return handleNewOwner(false)({ context, event });
  });

  ponder.on(pluginNamespace("RegistryOld:NewResolver"), async ({ context, event }) => {
    // NOTE: the subgraph makes an exception for the root node here
    // but i don't know that that's necessary, as in ponder our root node starts out
    // unmigrated and once the NewOwner event is emitted by the new registry,
    // the root will be considered migrated
    // https://github.com/ensdomains/ens-subgraph/blob/master/src/ensRegistry.ts#L246

    // otherwise, only handle iff not migrated
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleNewResolver({ context, event });
  });

  ponder.on(pluginNamespace("RegistryOld:NewTTL"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleNewTTL({ context, event });
  });

  ponder.on(pluginNamespace("RegistryOld:Transfer"), async ({ context, event }) => {
    const isMigrated = await isDomainMigrated(context, event.args.node);
    if (isMigrated) return;
    return handleTransfer({ context, event });
  });

  ponder.on(pluginNamespace("Registry:NewOwner"), handleNewOwner(true));
  ponder.on(pluginNamespace("Registry:NewResolver"), handleNewResolver);
  ponder.on(pluginNamespace("Registry:NewTTL"), handleNewTTL);
  ponder.on(pluginNamespace("Registry:Transfer"), handleTransfer);
}
