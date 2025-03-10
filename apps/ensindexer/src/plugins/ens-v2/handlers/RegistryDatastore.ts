import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { makeContractId, makeLabelId, maskTokenId } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:SubregistryUpdate"), async ({ context, event }) => {
    console.table({ on: "RegistryDatastore:SubregistryUpdate", ...event.args });

    const { registry, labelHash, subregistry, flags } = event.args;

    const tokenId = maskTokenId(labelHash); // NOTE: ensure tokenId is masked correctly
    const registryId = makeContractId(context.network.chainId, registry);
    const labelId = makeLabelId(registryId, tokenId);
    const subregistryId = makeContractId(context.network.chainId, subregistry);

    // ensure registry entity
    await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

    // ensure subregistry entity
    await context.db.insert(schema.v2_registry).values({ id: subregistryId }).onConflictDoNothing();

    await context.db
      .insert(schema.v2_label)
      // insert label with subregistry info
      .values({ id: labelId, registryId, tokenId, subregistryId, subregistryFlags: flags })
      // or update existing label with subregistry info
      .onConflictDoUpdate({ subregistryId, subregistryFlags: flags });
  });

  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:ResolverUpdate"), async ({ context, event }) => {
    console.table({ on: "RegistryDatastore:ResolverUpdate", ...event.args });

    const { registry, labelHash, resolver, flags } = event.args;

    const tokenId = maskTokenId(labelHash); // NOTE: ensure tokenId is masked correctly
    const registryId = makeContractId(context.network.chainId, registry);
    const labelId = makeLabelId(registryId, tokenId);
    const resolverId = makeContractId(context.network.chainId, resolver);

    // ensure registry entity
    await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

    // ensure resolver entity
    await context.db.insert(schema.v2_resolver).values({ id: resolverId }).onConflictDoNothing();

    await context.db
      .insert(schema.v2_label)
      // insert label with resolver info
      .values({ id: labelId, registryId, tokenId, resolverId, resolverFlags: flags })
      // or update existing label with resolver info
      .onConflictDoUpdate({ resolverId, resolverFlags: flags });
  });
}
