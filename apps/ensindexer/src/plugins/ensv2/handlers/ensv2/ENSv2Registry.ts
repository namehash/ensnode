import {
  type AccountId,
  type LabelHash,
  makeENSv2DomainId,
  makeRegistryId,
  makeStorageId,
} from "enssdk";
import { type Address, hexToBigInt, labelhash } from "viem";

import {
  interpretAddress,
  isRegistrationFullyExpired,
  type LiteralLabel,
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
  /**
   * In an ENSv2 Registry, a Reservation is just a Registration with no `owner`, so we unify the
   * handling of these two pathways here.
   */
  async function handleRegistrationOrReservation({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{
      tokenId: bigint;
      labelHash: LabelHash;
      label: string;
      // NOTE: marking `owner` as optional to handle both LabelRegistered and LabelReserved events
      owner?: Address;
      expiry: bigint;
      sender: Address;
    }>;
  }) {
    const { tokenId, labelHash, label: _label, owner, expiry, sender: registrant } = event.args;
    const label = _label as LiteralLabel;
    const isReservation = owner === undefined;

    const registry = getThisAccountId(context, event);
    const registryId = makeRegistryId(registry);
    const storageId = makeStorageId(tokenId);
    const domainId = makeENSv2DomainId(registry, storageId);

    // Sanity Check: LabelHash must match Label
    if (labelHash !== labelhash(label)) {
      throw new Error(`Sanity Check: labelHash !== labelhash(label)\n${toJson(event.args)}`);
    }

    // Sanity Check: StorageId derived from tokenId must match StorageId derived from LabelHash
    if (storageId !== makeStorageId(hexToBigInt(labelHash))) {
      throw new Error(
        `Sanity Check: storageId !== makeStorageId(hexToBigInt(labelHash))\n${toJson(event.args)}`,
      );
    }

    // ensure Registry
    // TODO(signals) — move to NewRegistry and add invariant here
    await context.ensDb
      .insert(ensIndexerSchema.registry)
      .values({ id: registryId, ...registry })
      .onConflictDoNothing();

    // ensure discovered Label
    await ensureLabel(context, label);

    const registration = await getLatestRegistration(context, domainId);
    if (isReservation) {
      // Invariant: if this is a Reservation, any existing Registration should be fully expired
      if (registration && !isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(ENSv2Registry:Label[Registered|Reserved]): Existing unexpired Registration found, expected none or expired.\n${toJson(registration)}`,
        );
      }
    } else {
      // Invariant: if this is a Registration, unless it is a Reservation, it should be fully expired
      if (
        registration &&
        registration.type !== "ENSv2RegistryReservation" &&
        !isRegistrationFullyExpired(registration, event.block.timestamp)
      ) {
        throw new Error(
          `Invariant(ENSv2Registry:Label[Registered|Reserved]): Existing unexpired Registration found, expected none or expired.\n${toJson(registration)}`,
        );
      }
    }

    // ensure v2Domain
    await context.ensDb
      .insert(ensIndexerSchema.v2Domain)
      .values({
        id: domainId,
        tokenId,
        registryId,
        labelHash,
        // NOTE: we intentionally omit setting ownerId here. either
        // a) this is a Registration, in which case a TransferSingle event will be emitted afterwards, or
        // b) this is a Reservation, in which there is no owner
      })
      // if the v2Domain exists, this is a re-register after expiration and tokenId will have changed
      .onConflictDoUpdate({ tokenId });

    // insert Registration
    await ensureAccount(context, registrant);
    await insertLatestRegistration(context, {
      domainId,
      type: isReservation ? "ENSv2RegistryReservation" : "ENSv2RegistryRegistration",
      registrarChainId: registry.chainId,
      registrarAddress: registry.address,
      registrantId: interpretAddress(registrant),
      start: event.block.timestamp,
      expiry,
      eventId: await ensureEvent(context, event),
    });

    // push event to domain history
    await ensureDomainEvent(context, event, domainId);
  }

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:LabelRegistered"),
    handleRegistrationOrReservation,
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:LabelReserved"),
    handleRegistrationOrReservation,
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:LabelUnregistered"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: bigint;
        sender: Address;
      }>;
    }) => {
      const { tokenId, sender: unregistrant } = event.args;

      const registry = getThisAccountId(context, event);
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be an existing Registration
      if (!registration) {
        throw new Error(`Invariant(ENSv2Registry:LabelUnregistered): Expected registration.`);
      }

      // Invariant: The existing Registration must not be expired.
      if (isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(ENSv2Registry:LabelUnregistered): Expected unexpired registration but got:\n${toJson(registration)}`,
        );
      }

      // unregistering a label just immediately sets its expiration to event.block.timestamp, which
      // effectively removes it from resolution (which interprets expired names as non-existent)
      await ensureAccount(context, unregistrant);
      await context.ensDb.update(ensIndexerSchema.registration, { id: registration.id }).set({
        expiry: event.block.timestamp,
        unregistrantId: interpretAddress(unregistrant),
      });

      // NOTE(shrugs): PermissionedRegistry also increments eacVersionId and tokenVersionId if there was a
      // previous owner, but i'm not sure if we need to handle that detail here

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
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be an existing Registration
      if (!registration) {
        throw new Error(`Invariant(ENSv2Registry:ExpiryUpdated): Expected registration.`);
      }

      // Invariant: The existing Registration must not be expired.
      if (isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(ENSv2Registry:ExpiryUpdated): Expected unexpired Registration but got:\n${toJson(registration)}`,
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
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registryAccountId, storageId);

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

      // Invariant: StorageIds must match
      if (makeStorageId(oldTokenId) !== makeStorageId(newTokenId)) {
        throw new Error(`Invariant(ENSv2Registry:TokenRegenerated): Storage Id Malformed.`);
      }

      const storageId = makeStorageId(oldTokenId);
      const registryAccountId = getThisAccountId(context, event);
      const domainId = makeENSv2DomainId(registryAccountId, storageId);

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

    const storageId = makeStorageId(tokenId);
    const registry = getThisAccountId(context, event);
    const domainId = makeENSv2DomainId(registry, storageId);

    // TODO(signals): remove this invariant, since we'll only be indexing Registry contracts
    const registryId = makeRegistryId(registry);
    const exists = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
    if (!exists) return; // no-op non-Registry ERC1155 Transfers

    // update the Domain's ownerId
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
