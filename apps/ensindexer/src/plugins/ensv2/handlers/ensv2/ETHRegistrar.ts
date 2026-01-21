import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import type { Address } from "viem";

import {
  type AccountId,
  type EncodedReferrer,
  getCanonicalId,
  interpretAddress,
  isRegistrationFullyExpired,
  makeENSv2DomainId,
  makeLatestRenewalId,
  PluginName,
  type TokenId,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureEvent } from "@/lib/ensv2/event-db-helpers";
import {
  getLatestRegistration,
  getLatestRenewal,
  supercedeLatestRenewal,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs, LogEvent } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

async function getRegistrarAndRegistry(context: Context, event: LogEvent) {
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
  ponder.on(
    namespaceContract(pluginName, "ETHRegistrar:NameRegistered"),
    async ({
      context,
      event,
    }: {
      context: Context;
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
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registry, canonicalId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: must have latest Registration
      if (!registration) {
        throw new Error(
          `Invariant(ETHRegistrar:NameRegistered): Registration expected, none found.`,
        );
      }

      // Invariant: must be ENSv2Registry Registration
      if (registration.type !== "ENSv2Registry") {
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
      await context.db.update(schema.registration, { id: registration.id }).set({
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
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ETHRegistrar:NameRenewed"),
    async ({
      context,
      event,
    }: {
      context: Context;
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
      const canonicalId = getCanonicalId(tokenId);
      const domainId = makeENSv2DomainId(registry, canonicalId);

      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be a Registration to renew.
      if (!registration) {
        throw new Error(`Invariant(ETHRegistrar:NameRenewed): No Registration to renew.`);
      }

      // Invariant: Must be ENSv2Registry Registration
      if (registration.type !== "ENSv2Registry") {
        throw new Error(
          `Invariant(ETHRegistrar:NameRenewed): Registration found but not ENSv2Registry Registration:\n${toJson(registration)}`,
        );
      }

      // get latest Renewal and supercede if exists
      const renewal = await getLatestRenewal(context, domainId, registration.index);
      if (renewal) await supercedeLatestRenewal(context, renewal);

      // insert latest Renewal
      await context.db.insert(schema.renewal).values({
        id: makeLatestRenewalId(domainId, registration.index),
        domainId,
        registrationIndex: registration.index,
        index: renewal ? renewal.index + 1 : 0,
        duration,
        referrer,
        eventId: await ensureEvent(context, event),

        // TODO(paymentToken)
        base,
      });
    },
  );
}
