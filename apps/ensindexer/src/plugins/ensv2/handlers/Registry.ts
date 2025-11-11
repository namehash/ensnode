import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { replaceBigInts } from "ponder";
import { type Address, hexToBigInt, isAddressEqual, labelhash, zeroAddress } from "viem";

import {
  type AccountId,
  getCanonicalId,
  type LiteralLabel,
  makeENSv2DomainId,
  makeRegistryContractId,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureLabel } from "@/lib/ensv2/labelspace-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

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

      const registryAccountId = getThisAccountId(context, event);
      const registryId = makeRegistryContractId(registryAccountId);
      const canonicalId = getCanonicalId(tokenId);
      const labelHash = labelhash(label);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

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

      // upsert Registry
      await context.db
        .insert(schema.registry)
        .values({
          id: registryId,
          type: "RegistryContract",
          ...registryAccountId,
        })
        .onConflictDoNothing();

      // ensure discovered Label
      await ensureLabel(context, label);

      // insert Domain
      await context.db
        .insert(schema.domain)
        .values({ id: domainId, registryId, labelHash, canonicalId });

      // TODO: insert Registration entity for this domain as well: expiration, registrant
      // ensure Registrant
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

      const registryAccountId = getThisAccountId(context, event);
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      // update domain's subregistry
      const isDeletion = isAddressEqual(subregistry, zeroAddress);
      if (isDeletion) {
        await context.db.update(schema.domain, { id: domainId }).set({ subregistryId: null });
      } else {
        const subregistryAccountId: AccountId = { chainId: context.chain.id, address: subregistry };
        const subregistryId = makeRegistryContractId(subregistryAccountId);

        await context.db.update(schema.domain, { id: domainId }).set({ subregistryId });
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
      const registryAccountId = getThisAccountId(context, event);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      // update domain's resolver
      const isDeletion = isAddressEqual(resolver, zeroAddress);
      if (isDeletion) {
        await context.db
          .update(schema.domain, { id: domainId })
          .set({ resolverChainId: null, resolverAddress: null });
      } else {
        await context.db
          .update(schema.domain, { id: domainId })
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
      const registryAccountId = getThisAccountId(context, event);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      await context.db.delete(schema.domain, { id: domainId });
      // TODO: delete registration (?)
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
    const registryAccountId = getThisAccountId(context, event);
    const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

    // just update the owner, NameBurned handles existence
    await context.db.update(schema.domain, { id: domainId }).set({ ownerId: owner });
  }

  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:TransferSingle"),
    async ({ context, event }) => {
      const registryAccountId = getThisAccountId(context, event);
      const registryId = makeRegistryContractId(registryAccountId);

      // TODO(registry-announcement): ideally remove this
      const registry = await context.db.find(schema.registry, { id: registryId });
      if (registry === null) return; // no-op non-Registry ERC1155 Transfers

      await handleTransferSingle({ context, event });
    },
  );
  ponder.on(
    namespaceContract(PluginName.ENSv2, "Registry:TransferBatch"),
    async ({ context, event }) => {
      const registryAccountId = getThisAccountId(context, event);
      const registryId = makeRegistryContractId(registryAccountId);

      // TODO(registry-announcement): ideally remove this
      const registry = await context.db.find(schema.registry, { id: registryId });
      if (registry === null) return; // no-op non-Registry ERC1155 Transfers

      for (const id of event.args.ids) {
        await handleTransferSingle({
          context,
          event: { ...event, args: { ...event.args, id } },
        });
      }
    },
  );
}
