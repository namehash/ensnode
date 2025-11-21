import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { GRACE_PERIOD_SECONDS } from "@ensdomains/ensjs/utils";
import { type Address, isAddressEqual, namehash, zeroAddress } from "viem";

import {
  interpretAddress,
  makeENSv1DomainId,
  makeLatestRegistrationId,
  makeSubdomainNode,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { materializeENSv1DomainEffectiveOwner } from "@/lib/ensv2/domain-db-helpers";
import { getRegistrarManagedName, registrarTokenIdToLabelHash } from "@/lib/ensv2/registrar-lib";
import {
  getLatestRegistration,
  isRegistrationFullyExpired,
  supercedeLatestRegistration,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

// legacy always updates registry so domain is guaranteed to exist
// wrapped always updates registry so domain is guaranteed to exist
// unwrapped always updates registry so domain is guaranteed to exist

// technically all BaseRegistry-derived contracts have the ability to `registerOnly` and therefore
// don't represent a valid ENS name. then they can be re-registered
// renewals work on registered names because that's obvious
// and in this model it's valid for a registration to reference a domain that does not exist
// and we _don't_ update owner
// that's why registrars manage their own set of owners (registrants), which can be desynced from a domain's owner
// so in the registrar handlers we should never touch schema.domain, only reference them.

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
      // in all such cases, a Registration is expected and we can

      const labelHash = registrarTokenIdToLabelHash(tokenId);
      const registrar = getThisAccountId(context, event);
      const managedNode = namehash(getRegistrarManagedName(registrar));
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
    const { id: tokenId, owner, expires: expiration } = event.args;
    const registrant = owner;

    const labelHash = registrarTokenIdToLabelHash(tokenId);
    const registrar = getThisAccountId(context, event);
    const managedNode = namehash(getRegistrarManagedName(registrar));
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
      expiration,
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
      const { id: tokenId, expires: expiration } = event.args;

      const labelHash = registrarTokenIdToLabelHash(tokenId);
      const registrar = getThisAccountId(context, event);
      const managedNode = namehash(getRegistrarManagedName(registrar));
      const node = makeSubdomainNode(labelHash, managedNode);
      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);

      // Invariant: There must be a Registration to renew.
      if (!registration) {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted but no Registration to renew.`,
        );
      }

      // Invariant: The Registation must not be fully expired.
      // https://github.com/ensdomains/ens-contracts/blob/b6cb0e26/contracts/ethregistrar/BaseRegistrarImplementation.sol#L161
      if (isRegistrationFullyExpired(registration, event.block.timestamp)) {
        throw new Error(
          `Invariant(BaseRegistrar:NameRenewed): NameRenewed emitted but no unexpired registration\n${toJson({ registration, timestamp: event.block.timestamp })}`,
        );
      }

      // update the registration
      await context.db.update(schema.registration, { id: registration.id }).set({ expiration });

      // TODO: insert renewal & reference registration
    },
  );
}
