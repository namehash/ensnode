import { type Address, hexToBigInt, labelhash } from "viem";

import {
  type AccountId,
  getCanonicalId,
  interpretAddress,
  isRegistrationFullyExpired,
  type LabelHash,
  type LiteralLabel,
  makeENSv2DomainId,
  makeRegistryId,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureDomainEvent, ensureEvent } from "@/lib/ensv2/event-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import {
  getLatestRegistration,
  insertLatestRegistration,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:NameRegistered"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: bigint;
        labelHash: LabelHash;
        label: string;
        owner: Address;
        expiry: bigint;
        sender: Address;
      }>;
    }) => {
      const { tokenId, label: _label, expiry, sender: registrant } = event.args;
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
      await context.ensDb
        .insert(ensIndexerSchema.registry)
        .values({
          id: registryId,
          type: "RegistryContract",
          ...registry,
        })
        .onConflictDoNothing();

      // TODO(bridged-registries): upon registry creation, write the registry's canonical domain here

      // ensure discovered Label
      await ensureLabel(context, label);

      const registration = await getLatestRegistration(context, domainId);
      const isFullyExpired =
        registration && isRegistrationFullyExpired(registration, event.block.timestamp);

      // Invariant: If a Registration for this v2Domain exists, it must be fully expired
      if (registration && !isFullyExpired) {
        throw new Error(
          `Invariant(ENSv2Registry:NameRegistered): Existing unexpired ENSv2Registry Registration found in NameRegistered, expected none or expired.\n${toJson(registration)}`,
        );
      }

      // insert or update v2Domain
      // console.log(`NameRegistered: '${label}'\n ↳ ${domainId}`);
      await context.ensDb
        .insert(ensIndexerSchema.v2Domain)
        .values({
          id: domainId,
          tokenId,
          registryId,
          labelHash,
          // NOTE: ownerId omitted, Transfer* events are sole source of ownership
        })
        // if the v2Domain exists, this is a re-register after expiration and tokenId may have changed
        .onConflictDoUpdate({ tokenId });

      // insert ENSv2Registry Registration
      await ensureAccount(context, registrant);
      await insertLatestRegistration(context, {
        domainId,
        type: "ENSv2Registry",
        registrarChainId: registry.chainId,
        registrarAddress: registry.address,
        registrantId: interpretAddress(registrant),
        start: event.block.timestamp,
        expiry,
        eventId: await ensureEvent(context, event),
      });

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:ExpiryUpdated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: bigint;
        newExpiry: bigint;
        sender: Address;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: not sure if we care to index sender
      const { tokenId, newExpiry: expiry, sender } = event.args;

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
      await context.ensDb
        .update(ensIndexerSchema.registration, { id: registration.id })
        .set({ expiry });

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:SubregistryUpdated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
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
        // TODO(canonical-names): this last-write-wins heuristic breaks if a domain ever unsets its
        // subregistry. i.e. the (sub)Registry's Canonical Domain becomes null, making it disjoint because
        // we don't track other domains who have set it as a Subregistry. This is acceptable for now,
        // and obviously isn't an issue once ENS Team implements Canonical Names
        const previous = await context.ensDb.find(ensIndexerSchema.v2Domain, { id: domainId });
        if (previous?.subregistryId) {
          await context.ensDb.delete(ensIndexerSchema.registryCanonicalDomain, {
            registryId: previous.subregistryId,
          });
        }

        await context.ensDb
          .update(ensIndexerSchema.v2Domain, { id: domainId })
          .set({ subregistryId: null });
      } else {
        const subregistryAccountId: AccountId = { chainId: context.chain.id, address: subregistry };
        const subregistryId = makeRegistryId(subregistryAccountId);

        // TODO(canonical-names): this implements last-write-wins heuristic for a Registry's canonical name,
        // replace with real logic once ENS Team implements Canonical Names
        await context.ensDb
          .insert(ensIndexerSchema.registryCanonicalDomain)
          .values({ registryId: subregistryId, domainId })
          .onConflictDoUpdate({ domainId });

        await context.ensDb
          .update(ensIndexerSchema.v2Domain, { id: domainId })
          .set({ subregistryId });
      }

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:TokenRegenerated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        oldTokenId: bigint;
        newTokenId: bigint;
      }>;
    }) => {
      const { oldTokenId, newTokenId } = event.args;

      // Invariant: CanonicalIds must match
      if (getCanonicalId(oldTokenId) !== getCanonicalId(newTokenId)) {
        throw new Error(`Invariant(ENSv2Registry:TokenRegenerated): Canonical ID Malformed.`);
      }

      const canonicalId = getCanonicalId(oldTokenId);
      const registryAccountId = getThisAccountId(context, event);
      const domainId = makeENSv2DomainId(registryAccountId, canonicalId);

      await context.ensDb
        .update(ensIndexerSchema.v2Domain, { id: domainId })
        .set({ tokenId: newTokenId });

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );

  async function handleTransferSingle({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{ id: bigint; to: Address }>;
  }) {
    const { id: tokenId, to: owner } = event.args;

    const canonicalId = getCanonicalId(tokenId);
    const registry = getThisAccountId(context, event);
    const domainId = makeENSv2DomainId(registry, canonicalId);

    // TODO(signals): remove this
    const registryId = makeRegistryId(registry);
    const exists = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
    if (!exists) return; // no-op non-Registry ERC1155 Transfers

    // just update the owner
    // any _burns are always followed by a _mint, which would set the owner correctly
    await context.ensDb
      .update(ensIndexerSchema.v2Domain, { id: domainId })
      .set({ ownerId: interpretAddress(owner) });

    // push event to domain history
    await ensureDomainEvent(context, event, domainId);
  }

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:TransferSingle"),
    handleTransferSingle,
  );
  addOnchainEventListener(
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
