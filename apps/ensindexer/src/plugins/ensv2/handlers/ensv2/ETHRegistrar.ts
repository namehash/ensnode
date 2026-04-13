import {
  type AccountId,
  type Address,
  makeENSv2DomainId,
  makeStorageId,
  type TokenId,
} from "enssdk";

import {
  type EncodedReferrer,
  interpretAddress,
  isRegistrationFullyExpired,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureDomainEvent, ensureEvent } from "@/lib/ensv2/event-db-helpers";
import { getLatestRegistration, insertLatestRenewal } from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs, LogEventBase } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

async function getRegistrarAndRegistry(context: IndexingEngineContext, event: LogEventBase) {
  const registrar = getThisAccountId(context, event);
  const registry: AccountId = {
    chainId: context.chain.id,
    // ETHRegistrar (this contract) provides a handle to its backing Registry
    address: await context.client.readContract({
      abi: context.contracts[namespaceContract(pluginName, "ETHRegistrar")].abi,
      address: event.log.address,
      functionName: "REGISTRY",
    }),
  };

  return { registrar, registry };
}

export default function () {
  addOnchainEventListener(
    namespaceContract(pluginName, "ETHRegistrar:NameRegistered"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: TokenId;
        label: string;
        owner: Address;
        subregistry: Address;
        resolver: Address;
        duration: bigint;
        referrer: EncodedReferrer;
        paymentToken: Address;
        base: bigint;
        premium: bigint;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: TODO(paymentToken)
      const { tokenId, owner, referrer, paymentToken, base, premium } = event.args;

      // NOTE: Label and Domain operations are handled by ENSv2Registry:NameRegistered
      // (see apps/ensindexer/src/plugins/ensv2/handlers/ensv2/ENSv2Registry.ts) which occurs
      // _before_ this event. This event upserts the latest Registration with payment info.

      const { registrar, registry } = await getRegistrarAndRegistry(context, event);
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: must have latest Registration
      if (!registration) {
        throw new Error(
          `Invariant(ETHRegistrar:NameRegistered): Registration expected, none found.`,
        );
      }

      // Invariant: must be ENSv2Registry Registration
      if (registration.type !== "ENSv2RegistryRegistration") {
        throw new Error(
          `Invariant(ETHRegistrar:NameRegistered): Registration found but not ENSv2Registry Registration:\n${toJson(registration)}`,
        );
      }

      // Invariant: must not be expired
      const isFullyExpired = isRegistrationFullyExpired(registration, event.block.timestamp);
      if (isFullyExpired) {
        throw new Error(
          `Invariant(ETHRegistrar:NameRegistered): Registration found but expired:\n${toJson(registration)}`,
        );
      }

      // upsert registrant
      await ensureAccount(context, owner);

      // update latest Registration
      await context.ensDb.update(ensIndexerSchema.registration, { id: registration.id }).set({
        // TODO: reconsider 'Registration.registrant' if ENSv2 doesn't provide explicit 'registrant'
        registrantId: interpretAddress(owner),

        // we now know the correct registrar to attribute to, so overwrite
        registrarChainId: registrar.chainId,
        registrarAddress: registrar.address,

        referrer,

        // TODO(paymentToken): add payment token tracking here
        base,
        premium,
      });

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "ETHRegistrar:NameRenewed"),
    async ({
      context,
      event,
    }: {
      context: IndexingEngineContext;
      event: EventWithArgs<{
        tokenId: TokenId;
        label: string;
        duration: bigint;
        newExpiry: bigint;
        referrer: EncodedReferrer;
        paymentToken: Address;
        base: bigint;
      }>;
    }) => {
      // biome-ignore lint/correctness/noUnusedVariables: TODO(paymentToken)
      const { tokenId, duration, referrer, paymentToken, base } = event.args;

      // this event occurs _after_ ENSv2Registry:ExpiryUpdated and therefore does not need to
      // update Registration.expiry, it just needs to update the latest Renewal

      const { registry } = await getRegistrarAndRegistry(context, event);
      const storageId = makeStorageId(tokenId);
      const domainId = makeENSv2DomainId(registry, storageId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be a Registration to renew.
      if (!registration) {
        throw new Error(`Invariant(ETHRegistrar:NameRenewed): No Registration to renew.`);
      }

      // Invariant: Must be ENSv2Registry Registration
      if (registration.type !== "ENSv2RegistryRegistration") {
        throw new Error(
          `Invariant(ETHRegistrar:NameRenewed): Registration found but not ENSv2Registry Registration:\n${toJson(registration)}`,
        );
      }

      // insert Renewal
      await insertLatestRenewal(context, registration, {
        domainId,
        duration,
        referrer,
        eventId: await ensureEvent(context, event),

        // TODO(paymentToken)
        base,
      });

      // push event to domain history
      await ensureDomainEvent(context, event, domainId);
    },
  );
}
