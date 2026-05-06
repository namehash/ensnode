import {
  type AccountId,
  asLiteralLabel,
  type LabelHash,
  labelhashLiteralLabel,
  makeENSv2DomainId,
  makeENSv2RegistryId,
  makeStorageId,
  type NormalizedAddress,
  type TokenId,
  type UnixTimestampBigInt,
} from "enssdk";
import { hexToBigInt } from "viem";

import {
  interpretAddress,
  isRegistrationFullyExpired,
  PluginName,
  toJson,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import {
  ensureDomainInRegistry,
  handleBridgedResolverChange,
  handleSubregistryUpdated,
  setRegistryCanonicalDomain,
} from "@/lib/ensv2/canonicality-db-helpers";
import { ensureDomainEvent, ensureEvent } from "@/lib/ensv2/event-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import {
  getLatestRegistration,
  insertLatestRegistration,
} from "@/lib/ensv2/registration-db-helpers";
import { ensureRegistry } from "@/lib/ensv2/registry-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
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
      tokenId: TokenId;
      labelHash: LabelHash;
      label: string;
      // NOTE: marking `owner` as optional to handle both LabelRegistered and LabelReserved events
      owner?: NormalizedAddress;
      expiry: UnixTimestampBigInt;
      sender: NormalizedAddress;
    }>;
  }) {
    const { tokenId, labelHash, owner, expiry, sender: registrant } = event.args;
    const label = asLiteralLabel(event.args.label);
    const isReservation = owner === undefined;

    const registry = getThisAccountId(context, event);
    const registryId = makeENSv2RegistryId(registry);
    const storageId = makeStorageId(tokenId);
    const domainId = makeENSv2DomainId(registry, storageId);

    // Sanity Check: LabelHash must match Label
    if (labelHash !== labelhashLiteralLabel(label)) {
      throw new Error(
        `Sanity Check: labelHash !== labelhashLiteralLabel(label)\n${toJson(event.args, { pretty: true })}`,
      );
    }

    // Sanity Check: StorageId derived from tokenId must match StorageId derived from LabelHash
    if (storageId !== makeStorageId(hexToBigInt(labelHash))) {
      throw new Error(
        `Sanity Check: storageId !== makeStorageId(hexToBigInt(labelHash))\n${toJson(event.args, { pretty: true })}`,
      );
    }

    // ensure Registry
    // TODO(signals) — move to NewRegistry and add invariant here
    await ensureRegistry(context, registryId, { type: "ENSv2Registry", ...registry });

    // ensure discovered Label
    await ensureLabel(context, label);

    const registration = await getLatestRegistration(context, domainId);
    if (isReservation) {
      // Invariant: if this is a Reservation, any existing Registration should be fully expired
      if (registration && !isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(ENSv2Registry:Label[Registered|Reserved]): Existing unexpired Registration found, expected none or expired.\n${toJson(registration, { pretty: true })}`,
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
          `Invariant(ENSv2Registry:Label[Registered|Reserved]): Existing unexpired Registration found, expected none or expired.\n${toJson(registration, { pretty: true })}`,
        );
      }
    }

    // ensure ENSv2 Domain
    await context.ensDb
      .insert(ensIndexerSchema.domain)
      .values({
        id: domainId,
        type: "ENSv2Domain",
        tokenId,
        registryId,
        labelHash,
        // NOTE: we intentionally omit setting ownerId here. either
        // a) this is a Registration, in which case a TransferSingle event will be emitted afterwards, or
        // b) this is a Reservation, in which there is no owner
      })
      // if the domain exists, this is a re-register after expiration and tokenId will have changed
      .onConflictDoUpdate({ tokenId });

    await ensureDomainInRegistry(context, registryId, domainId);

    // insert Registration
    const registrantId = await ensureAccount(context, registrant);
    const eventId = await ensureEvent(context, event, registrantId);
    await insertLatestRegistration(context, {
      domainId,
      type: isReservation ? "ENSv2RegistryReservation" : "ENSv2RegistryRegistration",
      registrarChainId: registry.chainId,
      registrarAddress: registry.address,
      registrantId,
      start: event.block.timestamp,
      expiry,
      eventId,
    });

    // push event to domain history
    await ensureDomainEvent(context, domainId, eventId);
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
        tokenId: TokenId;
        sender: NormalizedAddress;
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
          `Invariant(ENSv2Registry:LabelUnregistered): Expected unexpired registration but got:\n${toJson(registration, { pretty: true })}`,
        );
      }

      // unregistering a label just immediately sets its expiration to event.block.timestamp, which
      // effectively removes it from resolution (which interprets expired names as non-existent)
      const unregistrantId = await ensureAccount(context, unregistrant);
      await context.ensDb.update(ensIndexerSchema.registration, { id: registration.id }).set({
        expiry: event.block.timestamp,
        unregistrantId,
      });

      // NOTE(shrugs): PermissionedRegistry also increments eacVersionId and tokenVersionId if there was a
      // previous owner, but i'm not sure if we need to handle that detail here

      // push event to domain history
      const eventId = await ensureEvent(context, event, unregistrantId);
      await ensureDomainEvent(context, domainId, eventId);
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
        tokenId: TokenId;
        newExpiry: UnixTimestampBigInt;
        sender: NormalizedAddress;
      }>;
    }) => {
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
          `Invariant(ENSv2Registry:ExpiryUpdated): Expected unexpired Registration but got:\n${toJson(registration, { pretty: true })}`,
        );
      }

      // update Registration
      await context.ensDb
        .update(ensIndexerSchema.registration, { id: registration.id })
        .set({ expiry });

      // push event to domain history
      const senderId = await ensureAccount(context, sender);
      const eventId = await ensureEvent(context, event, senderId);
      await ensureDomainEvent(context, domainId, eventId);
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
        tokenId: TokenId;
        subregistry: NormalizedAddress;
        sender: NormalizedAddress;
      }>;
    }) => {
      const { tokenId, sender } = event.args;
      const subregistry = interpretAddress(event.args.subregistry);

      const registry = getThisAccountId(context, event);
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      const subregistryId = subregistry
        ? makeENSv2RegistryId({ chainId: registry.chainId, address: subregistry })
        : null;

      await handleSubregistryUpdated(context, domainId, subregistryId);

      // push event to domain history
      const senderId = await ensureAccount(context, sender);
      const eventId = await ensureEvent(context, event, senderId);
      await ensureDomainEvent(context, domainId, eventId);
    },
  );

  /**
   * `ParentUpdated(parent, label, sender)` is emitted by the _child_ Registry to claim its
   * canonical parent Domain in the namegraph. It may fire in either order relative to the parent
   * Registry's `SubregistryUpdated`/`LabelRegistered`.
   */
  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:ParentUpdated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        parent: NormalizedAddress;
        label: string;
        sender: NormalizedAddress;
      }>;
    }) => {
      const label = asLiteralLabel(event.args.label);
      const parent = interpretAddress(event.args.parent);

      const registry = getThisAccountId(context, event);
      const registryId = makeENSv2RegistryId(registry);

      if (parent) {
        // update the Canonical Domain, cascading the canonicality update to this registry's domains
        const parentRegistry: AccountId = { chainId: registry.chainId, address: parent };
        const labelHash = labelhashLiteralLabel(label);
        const domainId = makeENSv2DomainId(parentRegistry, makeStorageId(labelHash));

        await setRegistryCanonicalDomain(context, registryId, domainId);
      } else {
        // unset the Canonical Domain, cascading the canonicality update to this registry's domains
        await setRegistryCanonicalDomain(context, registryId, null);
      }

      // TODO: push event to registry history
      // const senderId = await ensureAccount(context, event.args.sender);
      // const eventId = await ensureEvent(context, event, senderId);
      // await ensureRegistryEvent(context, registryId, eventId);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ENSv2Registry:ResolverUpdated"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{ tokenId: TokenId; resolver: NormalizedAddress }>;
    }) => {
      const { tokenId } = event.args;
      const resolver = interpretAddress(event.args.resolver);

      const registry = getThisAccountId(context, event);
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      // handle changes in resolver that could affect Bridged Resolver Canonical Domain edges
      await handleBridgedResolverChange(context, registry, domainId, resolver);
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
        oldTokenId: TokenId;
        newTokenId: TokenId;
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
        .update(ensIndexerSchema.domain, { id: domainId })
        .set({ tokenId: newTokenId });

      // push event to domain history
      const eventId = await ensureEvent(context, event);
      await ensureDomainEvent(context, domainId, eventId);
    },
  );

  async function handleTransferSingle({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{ id: TokenId; to: NormalizedAddress; operator: NormalizedAddress }>;
  }) {
    const { id: tokenId, to: owner, operator } = event.args;

    const storageId = makeStorageId(tokenId);
    const registry = getThisAccountId(context, event);
    const domainId = makeENSv2DomainId(registry, storageId);

    // TODO(signals): remove this invariant, since we'll only be indexing Registry contracts
    const registryId = makeENSv2RegistryId(registry);
    const exists = await context.ensDb.find(ensIndexerSchema.registry, { id: registryId });
    if (!exists) return; // no-op non-Registry ERC1155 Transfers

    // update the Domain's ownerId
    const ownerId = await ensureAccount(context, owner);
    await context.ensDb.update(ensIndexerSchema.domain, { id: domainId }).set({ ownerId });

    // push event to domain history
    const operatorId = await ensureAccount(context, operator);
    const eventId = await ensureEvent(context, event, operatorId);
    await ensureDomainEvent(context, domainId, eventId);
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
