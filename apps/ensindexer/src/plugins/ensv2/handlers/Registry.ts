import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { replaceBigInts } from "ponder";
import { type Address, hexToBigInt, isAddressEqual, labelhash, zeroAddress } from "viem";

import { type AccountId, PluginName, serializeAccountId } from "@ensnode/ensnode-sdk";

import { makeAccountId } from "@/lib/make-account-id";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

// will need to filter all ERC1155 events by whether a Registry entity exists already or not, to
// avoid indexing literally all ERC1155 contracts on every chain. we still filter for those, which
// is awful performance.. hmm...

/**
 * A Domain's canonical ID is uint256(labelHash) with right-most 32 bits zero'd.
 */
const getCanonicalId = (tokenId: bigint) => tokenId ^ (tokenId & 0xffffffffn);

export default function () {
  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:NameRegistered"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        tokenId: bigint;
        label: string;
        expiration: bigint;
        registeredBy: Address;
      }>;
    }) => {
      const { tokenId, label, expiration, registeredBy: registrant } = event.args;

      const registryAccountId = makeAccountId(context, event);
      const registryId = serializeAccountId(registryAccountId);
      await context.db
        .insert(schema.registry)
        .values({
          id: registryId,
          type: "RegistryContract",
          ...registryAccountId,
        })
        .onConflictDoNothing();

      const canonicalId = getCanonicalId(tokenId);
      const labelHash = labelhash(label);

      // Sanity Check: Canonical Id must match emitted label
      if (canonicalId !== getCanonicalId(hexToBigInt(labelhash(label)))) {
        throw new Error(
          `Sanity Check: Domain's Canonical Id !== getCanonicalId(uint256(labelhash(label)))\n${JSON.stringify(
            replaceBigInts(
              {
                tokenId,
                canonicalId,
                label,
                labelHash,
                hexToBigInt: hexToBigInt(labelhash(label)),
              },
              String,
            ),
          )}`,
        );
      }

      await context.db.insert(schema.domain).values({
        registryId,
        canonicalId,
        labelHash,
        label,
      });

      // TODO: insert Registration entity for this domain as well: expiration, registrant
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:SubregistryUpdate"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        id: bigint;
        subregistry: Address;
      }>;
    }) => {
      const { id: tokenId, subregistry } = event.args;

      const canonicalId = getCanonicalId(tokenId);
      const registryAccountId = makeAccountId(context, event);
      const registryId = serializeAccountId(registryAccountId);

      // update domain's subregistry
      const isDeletion = isAddressEqual(subregistry, zeroAddress);
      if (isDeletion) {
        await context.db
          .update(schema.domain, { registryId, canonicalId })
          .set({ subregistryId: null });
      } else {
        const subregistryAccountId: AccountId = { chainId: context.chain.id, address: subregistry };
        const subregistryId = serializeAccountId(subregistryAccountId);

        await context.db.update(schema.domain, { registryId, canonicalId }).set({ subregistryId });
      }
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:ResolverUpdate"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        id: bigint;
        resolver: Address;
      }>;
    }) => {
      const { id: tokenId, resolver } = event.args;

      const canonicalId = getCanonicalId(tokenId);
      const registryAccountId = makeAccountId(context, event);
      const registryId = serializeAccountId(registryAccountId);

      // update domain's resolver
      const isDeletion = isAddressEqual(resolver, zeroAddress);
      if (isDeletion) {
        await context.db
          .update(schema.domain, { registryId, canonicalId })
          .set({ resolverChainId: null, resolverAddress: null });
      } else {
        await context.db
          .update(schema.domain, { registryId, canonicalId })
          .set({ resolverChainId: context.chain.id, resolverAddress: resolver });
      }
    },
  );
}
