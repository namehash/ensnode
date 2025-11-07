import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { replaceBigInts } from "ponder";
import { type Address, hexToBigInt, isAddressEqual, labelhash, zeroAddress } from "viem";

import {
  type AccountId,
  type LiteralLabel,
  PluginName,
  serializeAccountId,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/db-helpers";
import { ensureLabel } from "@/lib/ensv2/labelspace-db-helpers";
import {
  type DomainId,
  reconcileDomainAddition,
  reconcileDomainRemoval,
  reconcileRegistryAddition,
  reconcileRegistryRemoval,
} from "@/lib/ensv2/reconciliation";
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
      const { tokenId, label: _label, expiration, registeredBy: registrant } = event.args;
      const label = _label as LiteralLabel;

      const registryAccountId = makeAccountId(context, event);
      const registryId = serializeAccountId(registryAccountId);
      const canonicalId = getCanonicalId(tokenId);
      const labelHash = labelhash(label);
      const domainId: DomainId = { registryId, canonicalId };

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

      await context.db
        .insert(schema.registry)
        .values({
          id: registryId,
          type: "RegistryContract",
          ...registryAccountId,
        })
        .onConflictDoNothing();

      await ensureLabel(context, label);
      await context.db.insert(schema.domain).values({ ...domainId, labelHash });
      await reconcileDomainAddition(context, domainId);

      // TODO: insert Registration entity for this domain as well: expiration, registrant
      await ensureAccount(context, registrant);
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
      const domainId: DomainId = { registryId, canonicalId };

      const existing = await context.db.find(schema.domain, domainId);

      // update domain's subregistry
      const isDeletion = isAddressEqual(subregistry, zeroAddress);
      if (isDeletion) {
        await context.db.update(schema.domain, domainId).set({ subregistryId: null });

        // reconcile the removal of this registry from the canonical nametree
        if (existing && existing.subregistryId !== null) {
          await reconcileRegistryRemoval(context, existing.subregistryId);
        }
      } else {
        const subregistryAccountId: AccountId = { chainId: context.chain.id, address: subregistry };
        const subregistryId = serializeAccountId(subregistryAccountId);

        await context.db.update(schema.domain, domainId).set({ subregistryId });

        // reconcile the addition of this registry to the canonical nametree
        if (existing?.subregistryId !== subregistryId) {
          await reconcileRegistryAddition(context, subregistryId);
        }
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
      const domainId: DomainId = { registryId, canonicalId };

      // update domain's resolver
      const isDeletion = isAddressEqual(resolver, zeroAddress);
      if (isDeletion) {
        await context.db
          .update(schema.domain, domainId)
          .set({ resolverChainId: null, resolverAddress: null });
      } else {
        await context.db
          .update(schema.domain, domainId)
          .set({ resolverChainId: context.chain.id, resolverAddress: resolver });
      }
    },
  );

  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:NameBurned"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        tokenId: bigint;
        burnedBy: Address;
      }>;
    }) => {
      const { tokenId } = event.args;

      const canonicalId = getCanonicalId(tokenId);
      const registryAccountId = makeAccountId(context, event);
      const registryId = serializeAccountId(registryAccountId);
      const domainId: DomainId = { registryId, canonicalId };

      await context.db.delete(schema.domain, domainId);
      // TODO: delete registration (?)
      await reconcileDomainRemoval(context, domainId);
    },
  );

  async function handleTransferSingle({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{ id: bigint; to: Address }>;
  }) {
    const { id: tokenId, to: owner } = event.args;

    const canonicalId = getCanonicalId(tokenId);
    const registryAccountId = makeAccountId(context, event);
    const registryId = serializeAccountId(registryAccountId);
    const domainId: DomainId = { registryId, canonicalId };

    // just update the owner, NameBurned handles existence
    await context.db.update(schema.domain, domainId).set({ ownerId: owner });
  }

  ponder.on(namespaceContract(PluginName.ENSv2, "Registry:TransferSingle"), handleTransferSingle);
  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:TransferBatch"),
    async ({ context, event }) => {
      for (const id of event.args.ids) {
        await handleTransferSingle({
          context,
          event: { ...event, args: { ...event.args, id } },
        });
      }
    },
  );
}
