import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { GRACE_PERIOD_SECONDS } from "@ensdomains/ensjs/utils";
import { type Address, isAddressEqual, namehash, zeroAddress } from "viem";

import {
  interpretAddress,
  isRegistrationFullyExpired,
  makeENSv1DomainId,
  makeLatestRegistrationId,
  makeLatestRenewalId,
  makeSubdomainNode,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { materializeENSv1DomainEffectiveOwner } from "@/lib/ensv2/domain-db-helpers";
import {
  getLatestRegistration,
  getLatestRenewal,
  supercedeLatestRegistration,
  supercedeLatestRenewal,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { getManagedName, tokenIdToLabelHash } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

/**
 * In ENSv1, all BaseRegistrar-derived Registrar contracts (& their controllers) have the ability to
 * `registerOnly`, creating a 'preminted' name (a label with a Registration but no Domain in the
 * ENSv1 Registry). The .eth Registrar doesn't do this, but Basenames and Lineanames do.
 *
 * Because they all technically have this ability, this logic avoids the invariant that an associated
 * v1Domain must exist and the v1Domain.owner is conditionally materialized.
 *
 * Technically each BaseRegistrar Registration also has an associated owner that we could keep track
 * of, but because we're materializing the v1Domain's effective owner, we need not explicitly track
 * it. When a preminted name is actually registered, the indexing logic will see that the v1Domain
 * exists and materialize its effective owner correctly.
 */
export default function () {
  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:Transfer"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        from: Address;
        to: Address;
        tokenId: bigint;
      }>;
    }) => {
      const { from, to, tokenId } = event.args;

      const isMint = isAddressEqual(zeroAddress, from);

      // minting is always followed by Registrar#NameRegistered, safe to ignore
      if (isMint) return;

      // this is either:
      // a) a user transfering their registration token, or
      // b) re-registering a name that has expired, and it will emit NameRegistered directly afterwards, or
      // c) user intentionally burning their registration token by transferring to zeroAddress.
      //
      // in all such cases, a Registration is expected and we can conditionally materialize Domain owner

      const labelHash = tokenIdToLabelHash(tokenId);
      const registrar = getThisAccountId(context, event);
      const managedNode = namehash(getManagedName(registrar));
      const node = makeSubdomainNode(labelHash, managedNode);
      const domainId = makeENSv1DomainId(node);

      const registration = await getLatestRegistration(context, domainId);
      if (!registration) {
        throw new Error(`Invariant(BaseRegistrar:Transfer): expected existing Registration`);
      }

      // materialize Domain owner if exists
      const domain = await context.db.find(schema.v1Domain, { id: domainId });
      if (domain) await materializeENSv1DomainEffectiveOwner(context, domainId, to);
    },
  );

  async function handleNameRegistered({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      id: bigint;
      owner: Address;
      expires: bigint;
    }>;
  }) {
    const { id: tokenId, owner, expires: expiry } = event.args;
    const registrant = owner;

    const labelHash = tokenIdToLabelHash(tokenId);
    const registrar = getThisAccountId(context, event);
    const managedNode = namehash(getManagedName(registrar));
    const node = makeSubdomainNode(labelHash, managedNode);

    const domainId = makeENSv1DomainId(node);
    const registration = await getLatestRegistration(context, domainId);
    const isFullyExpired =
      registration && isRegistrationFullyExpired(registration, event.block.timestamp);

    // Invariant: If there is an existing Registration, it must be fully expired.
    if (registration && !isFullyExpired) {
      throw new Error(
        `Invariant(BaseRegistrar:NameRegistered): Existing unexpired registration found in NameRegistered, expected none or expired.\n${toJson(registration)}`,
      );
    }

    // supercede the latest Registration if exists
    if (registration) await supercedeLatestRegistration(context, registration);

    // insert BaseRegistrar Registration
    await ensureAccount(context, registrant);
    await context.db.insert(schema.registration).values({
      id: makeLatestRegistrationId(domainId),
      index: registration ? registration.index + 1 : 0,
      type: "BaseRegistrar",
      registrarChainId: registrar.chainId,
      registrarAddress: registrar.address,
      registrantId: interpretAddress(registrant),
      domainId,
      start: event.block.timestamp,
      expiry,
      // all BaseRegistrar-derived Registrars use the same GRACE_PERIOD
      gracePeriod: BigInt(GRACE_PERIOD_SECONDS),
    });

    // materialize Domain owner if exists
    const domain = await context.db.find(schema.v1Domain, { id: domainId });
    if (domain) await materializeENSv1DomainEffectiveOwner(context, domainId, owner);
  }

  ponder.on(namespaceContract(pluginName, "BaseRegistrar:NameRegistered"), handleNameRegistered);
  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRegisteredWithRecord"),
    handleNameRegistered,
  );

  ponder.on(
    namespaceContract(pluginName, "BaseRegistrar:NameRenewed"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ id: bigint; expires: bigint }>;
    }) => {
      const { id: tokenId, expires: expiry } = event.args;

      const labelHash = tokenIdToLabelHash(tokenId);
      const registrar = getThisAccountId(context, event);
      const managedNode = namehash(getManagedName(registrar));
      const node = makeSubdomainNode(labelHash, managedNode);
      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be a Registration to renew.
      if (!registration) {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted but no Registration to renew.`,
        );
      }

      // Invariant: Must be BaseRegistrar Registration
      if (registration.type !== "BaseRegistrar") {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted for a non-BaseRegistrar registration:\n${toJson(registration)}`,
        );
      }

      // Invariant: Because it is a BaseRegistrar Registration, it must have an expiry.
      if (registration.expiry === null) {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted for a BaseRegistrar registration that has a null expiry:\n${toJson(registration)}`,
        );
      }

      // Invariant: The Registation must not be fully expired.
      // https://github.com/ensdomains/ens-contracts/blob/b6cb0e26/contracts/ethregistrar/BaseRegistrarImplementation.sol#L161
      if (isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted but registration is expired:\n${toJson({ registration, timestamp: event.block.timestamp })}`,
        );
      }

      // infer duration
      const duration = expiry - registration.expiry;

      // update the registration
      await context.db.update(schema.registration, { id: registration.id }).set({ expiry });

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
        // NOTE: no pricing information from BaseRegistrar#NameRenewed. in ENSv1, this info is
        // indexed from the Registrar Controllers, see apps/ensindexer/src/plugins/ensv2/handlers/ensv1/RegistrarController.ts
      });
    },
  );
}
