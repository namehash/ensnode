import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, hexToBigInt, labelhash } from "viem";

import {
  type AccountId,
  getCanonicalId,
  interpretAddress,
  isRegistrationFullyExpired,
  type LiteralLabel,
  makeENSv2DomainId,
  makeLatestRegistrationId,
  makeRegistryId,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import {
  getLatestRegistration,
  supercedeLatestRegistration,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

export default function () {
  ponder.on(
    namespaceContract(pluginName, "ENSv2Registry:NameRegistered"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        tokenId: bigint;
        label: string;
        expiry: bigint;
        registeredBy: Address;
      }>;
    }) => {
      const { tokenId, label: _label, expiry, registeredBy: registrant } = event.args;
      const label = _label as LiteralLabel;

      const labelHash = labelhash(label);
      const registry = getThisAccountId(context, event);
      const registryId = makeRegistryId(registry);
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registry, canonicalId);

      // Sanity Check: Canonical Id must match emitted label
      if (canonicalId !== getCanonicalId(hexToBigInt(labelhash(label)))) {
        throw new Error(
          `Sanity Check: Domain's Canonical Id !== getCanonicalId(uint256(labelhash(label)))\n${toJson(
            {
              tokenId,
              canonicalId,
              label,
              labelHash,
              hexToBigInt: hexToBigInt(labelhash(label)),
            },
          )}`,
        );
      }

      // upsert Registry
      // TODO(signals) — move to NewRegistry and add invariant here
      await context.db
        .insert(schema.registry)
        .values({
          id: registryId,
          type: "RegistryContract",
          ...registry,
        })
        .onConflictDoNothing();

      // ensure discovered Label
      await ensureLabel(context, label);

      // insert v2Domain
      await context.db.insert(schema.v2Domain).values({
        id: domainId,
        tokenId,
        registryId,
        labelHash,
        // NOTE: ownerId omitted, Transfer* events are sole source of ownership
      });

      const registration = await getLatestRegistration(context, domainId);
      const isFullyExpired =
        registration && isRegistrationFullyExpired(registration, event.block.timestamp);

      // Invariant: If the latest Registration exists, it must be fully expired
      if (registration && !isFullyExpired) {
        throw new Error(
          `Invariant(ENSv2Registry:NameRegistered): Existing unexpired ENSv2Registry Registration found in NameRegistered, expected none or expired.\n${toJson(registration)}`,
        );
      }

      // supercede the latest Registration if exists
      if (registration) await supercedeLatestRegistration(context, registration);

      // insert ENSv2Registry Registration
      await ensureAccount(context, registrant);
      await context.db.insert(schema.registration).values({
        id: makeLatestRegistrationId(domainId),
        index: registration ? registration.index + 1 : 0,
        type: "ENSv2Registry",
        registrarChainId: registry.chainId,
        registrarAddress: registry.address,
        registrantId: interpretAddress(registrant),
        domainId,
        start: event.block.timestamp,
        expiry,
      });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ENSv2Registry:ExpiryUpdated"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        tokenId: bigint;
        newExpiry: bigint;
        changedBy: Address;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: not sure if we care to index changedBy
      const { tokenId, newExpiry: expiry, changedBy } = event.args;

      const registry = getThisAccountId(context, event);
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registry, canonicalId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: Registration must exist
      if (!registration) {
        throw new Error(`Invariant(ENSv2Registry:NameRenewed): Registration expected, none found.`);
      }

      // Invariant: Registration must not be expired
      if (isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(ENSv2Registry:NameRenewed): Registration found but it is expired:\n${toJson(registration)}`,
        );
      }

      // update Registration
      await context.db.update(schema.registration, { id: registration.id }).set({ expiry });

      // if newExpiry is 0, this is an `unregister` call, related to ejecting
      // https://github.com/ensdomains/namechain/blob/9e31679f4ee6d8abb4d4e840cdf06f2d653a706b/contracts/src/L1/bridge/L1BridgeController.sol#L141
      // TODO(migration): maybe do something special with this state?
      // if (expiry === 0n) return;
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ENSv2Registry:SubregistryUpdated"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        tokenId: bigint;
        subregistry: Address;
      }>;
    }) => {
      const { tokenId, subregistry: _subregistry } = event.args;
      const subregistry = interpretAddress(_subregistry);

      const registryAccountId = getThisAccountId(context, event);
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      // update domain's subregistry
      if (subregistry === null) {
        await context.db.update(schema.v2Domain, { id: domainId }).set({ subregistryId: null });
      } else {
        const subregistryAccountId: AccountId = { chainId: context.chain.id, address: subregistry };
        const subregistryId = makeRegistryId(subregistryAccountId);

        await context.db.update(schema.v2Domain, { id: domainId }).set({ subregistryId });
      }
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ENSv2Registry:TokenRegenerated"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        oldTokenId: bigint;
        newTokenId: bigint;
        resource: bigint;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: TODO: use resource
      const { oldTokenId, newTokenId, resource } = event.args;

      // Invariant: CanonicalIds must match
      if (getCanonicalId(oldTokenId) !== getCanonicalId(newTokenId)) {
        throw new Error(`Invariant(ENSv2Registry:TokenRegenerated): Canonical ID Malformed.`);
      }

      const canonicalId = getCanonicalId(oldTokenId);
      const registryAccountId = getThisAccountId(context, event);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      // TODO: likely need to track resource as well, since it depends on eacVersion
      // then we can likely provide a Domain.resource -> PermissionsResource resolver in the api

      await context.db.update(schema.v2Domain, { id: domainId }).set({ tokenId: newTokenId });
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
    const registry = getThisAccountId(context, event);
    const domainId = makeENSv2DomainId(registry, canonicalId);

    // TODO(signals): remove this
    const registryId = makeRegistryId(registry);
    const exists = await context.db.find(schema.registry, { id: registryId });
    if (!exists) return; // no-op non-Registry ERC1155 Transfers

    // just update the owner
    // any _burns are always followed by a _mint, which would set the owner correctly
    await context.db
      .update(schema.v2Domain, { id: domainId })
      .set({ ownerId: interpretAddress(owner) });
  }

  ponder.on(namespaceContract(pluginName, "ENSv2Registry:TransferSingle"), handleTransferSingle);
  ponder.on(
    namespaceContract(pluginName, "ENSv2Registry:TransferBatch"),
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
