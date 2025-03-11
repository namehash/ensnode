import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { makeContractId, makeLabelId, maskTokenId } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:SubregistryUpdate"), async ({ context, event }) => {
    const {
      registry: registryAddress,
      labelHash,
      subregistry: subregistryAddress,
      flags,
    } = event.args;

    const registryId = makeContractId(context.network.chainId, registryAddress);
    const tokenId = maskTokenId(labelHash); // NOTE: ensure tokenId is masked correctly
    const labelId = makeLabelId(registryId, tokenId);
    const subregistryId = makeContractId(context.network.chainId, subregistryAddress);

    console.table({
      on: "RegistryDatastore:SubregistryUpdate",
      registryId,
      tokenId,
      labelId,
      subregistryId,
      hash: event.transaction.hash,
    });

    // ensure registry entity
    await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

    // NOTE(registry-label-uniq): if subregistry is already linked to a label, must ignore this update
    // NOTE: implements first-write-wins for registry-label relations
    const existingSubregistry = await context.db.find(schema.v2_registry, { id: subregistryId });
    if (existingSubregistry?.labelId) {
      console.log(
        `tx ${event.transaction.hash} wanted to set the subregistry for ${labelId} to ${subregistryId} but that registry is already linked to another label (${existingSubregistry.labelId}) — ignoring.`,
      );
      return;
    }

    // ensure subregistry entity
    // TODO(registry-label-uniq): also update the reverse-mapping on the subregistry to point to this label
    await context.db
      .insert(schema.v2_registry)
      .values({ id: subregistryId, labelId })
      .onConflictDoUpdate({ labelId });

    await context.db
      .insert(schema.v2_label)
      // insert label with subregistry info
      .values({ id: labelId, registryId, tokenId, subregistryId, subregistryFlags: flags })
      // or update existing label with subregistry info
      .onConflictDoUpdate({ subregistryId, subregistryFlags: flags });
  });

  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:ResolverUpdate"), async ({ context, event }) => {
    const { registry: registryAddress, labelHash, resolver: resolverAddress, flags } = event.args;

    const registryId = makeContractId(context.network.chainId, registryAddress);
    const tokenId = maskTokenId(labelHash); // NOTE: ensure tokenId is masked correctly
    const labelId = makeLabelId(registryId, tokenId);
    const resolverId = makeContractId(context.network.chainId, resolverAddress);

    console.table({
      on: "RegistryDatastore:ResolverUpdate",
      registryId,
      tokenId,
      labelId,
      resolverId,
    });

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
