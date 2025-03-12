import { ponder } from "ponder:registry";
import schema from "ponder:schema";

import { PonderENSPluginHandlerArgs } from "../../../lib/plugin-helpers";
import { makeContractId, makeDomainId } from "../v2-lib";

export default function ({ namespace }: PonderENSPluginHandlerArgs<"ens-v2">) {
  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:SubregistryUpdate"), async ({ context, event }) => {
    const {
      registry: registryAddress,
      labelHash: tokenId, // NOTE: this variable is called labelHash but is actually masked tokenId
      subregistry: subregistryAddress,
      flags,
    } = event.args;

    const registryId = makeContractId(context.network.chainId, registryAddress);
    const domainId = makeDomainId(registryId, tokenId);
    const subregistryId = makeContractId(context.network.chainId, subregistryAddress);

    console.table({
      on: "RegistryDatastore:SubregistryUpdate",
      registryId,
      tokenId,
      domainId,
      subregistryId,
      hash: event.transaction.hash,
    });

    // ensure registry entity
    await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

    // NOTE(registry-domain-uniq): if subregistry is already linked to a domain, must ignore this update
    // NOTE: implements first-write-wins for registry-domain relations
    const existingSubregistry = await context.db.find(schema.v2_registry, { id: subregistryId });
    if (existingSubregistry?.domainId) {
      console.log(
        `tx ${event.transaction.hash} wanted to set the subregistry for ${domainId} to ${subregistryId} but that registry is already linked to another domain (${existingSubregistry.domainId}) — ignoring.`,
      );
      return;
    }

    // ensure subregistry entity
    // TODO(registry-domain-uniq): also update the reverse-mapping on the subregistry to point to this domain
    await context.db
      .insert(schema.v2_registry)
      .values({ id: subregistryId, domainId })
      .onConflictDoUpdate({ domainId });

    await context.db
      .insert(schema.v2_domain)
      // insert domain with subregistry info
      .values({ id: domainId, registryId, tokenId, subregistryId, subregistryFlags: flags })
      // or update existing domain with subregistry info
      .onConflictDoUpdate({ subregistryId, subregistryFlags: flags });
  });

  // NOTE: can arrive in any order, must upsert all relevant entities
  ponder.on(namespace("RegistryDatastore:ResolverUpdate"), async ({ context, event }) => {
    const {
      registry: registryAddress,
      labelHash: tokenId, // NOTE: this variable is called labelHash but is actually masked tokenId
      resolver: resolverAddress,
      flags,
    } = event.args;

    const registryId = makeContractId(context.network.chainId, registryAddress);
    const domainId = makeDomainId(registryId, tokenId);
    const resolverId = makeContractId(context.network.chainId, resolverAddress);

    console.table({
      on: "RegistryDatastore:ResolverUpdate",
      registryId,
      tokenId,
      domainId,
      resolverId,
    });

    // ensure registry entity
    await context.db.insert(schema.v2_registry).values({ id: registryId }).onConflictDoNothing();

    // ensure resolver entity
    await context.db.insert(schema.v2_resolver).values({ id: resolverId }).onConflictDoNothing();

    await context.db
      .insert(schema.v2_domain)
      // insert domain with resolver info
      .values({ id: domainId, registryId, tokenId, resolverId, resolverFlags: flags })
      // or update existing domain with resolver info
      .onConflictDoUpdate({ resolverId, resolverFlags: flags });
  });
}
