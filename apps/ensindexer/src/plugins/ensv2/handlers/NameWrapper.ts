import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, namehash, zeroAddress } from "viem";

import {
  type DNSEncodedLiteralName,
  type DNSEncodedName,
  decodeDNSEncodedLiteralName,
  isPccFuseSet,
  type LiteralLabel,
  labelhashLiteralLabel,
  makeENSv1DomainId,
  makeLatestRegistrationId,
  makeSubdomainNode,
  type Node,
  PluginName,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import { materializeDomainOwner } from "@/lib/ensv2/domain-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import { getRegistrarManagedName } from "@/lib/ensv2/registrar-lib";
import {
  getLatestRegistration,
  isRegistrationExpired,
  isRegistrationFullyExpired,
  isRegistrationInGracePeriod,
  supercedeLatestRegistration,
} from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

/**
 * When a name is wrapped in the NameWrapper contract, an ERC1155 token is minted that tokenizes
 * ownership of the name. The minted token will be assigned a unique tokenId represented as
 * uint256(namehash(name)) where name is the fqdn of the name being wrapped.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/wrapper/ERC1155Fuse.sol#L262
 */
const tokenIdToNode = (tokenId: bigint): Node => uint256ToHex32(tokenId);

/**
 * NameWrapper emits expiration but 0 means 'doesn't expire', we represent as null.
 */
const interpretExpiration = (expiration: bigint): bigint | null =>
  expiration === 0n ? null : expiration;

// registrar is source of truth for expiry if eth 2LD
// otherwise namewrapper is registrar and source of truth for expiry

//
// The FusesSet event indicates that fuses were written to storage, but:
// Does not guarantee the name is not expired
// Does not guarantee the fuses are actually active (they could be cleared by _clearOwnerAndFuses on read)
// Simply records the fuse value that was stored, regardless of expiration status
// For indexers, this means you need to track both the FusesSet event AND the expiry to determine the actual active fuses at any point in time.

// .eth 2LDs always have PARENT_CANNOT_CONTROL set ('burned'), they cannot be transferred during grace period

const isDirectSubnameOfRegistrarManagedName = (
  managedNode: Node,
  name: DNSEncodedLiteralName,
  node: Node,
) => {
  let labels: LiteralLabel[];
  try {
    labels = decodeDNSEncodedLiteralName(name);

    // extra runtime assertion of valid decode
    if (labels.length === 0) throw new Error("never");
  } catch {
    // must be decodable
    throw new Error(
      `Invariant(isSubnameOfRegistrarManagedName): NameWrapper emitted DNSEncodedNames for direct-subnames-of-registrar-managed-names MUST be decodable`,
    );
  }

  // construct the expected node using emitted name's leaf label and the registrarManagedNode
  // biome-ignore lint/style/noNonNullAssertion: length check above
  const leaf = labelhashLiteralLabel(labels[0]!);
  const expectedNode = makeSubdomainNode(leaf, managedNode);

  // Nodes must exactly match
  return node === expectedNode;
};

export default function () {
  /**
   * Transfer* events can occur for both expired and unexpired names.
   */
  async function handleTransfer({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      operator: Address;
      from: Address;
      to: Address;
      id: bigint;
    }>;
  }) {
    const { from, to, id: tokenId } = event.args;

    const isMint = isAddressEqual(zeroAddress, from);
    const isBurn = isAddressEqual(zeroAddress, to);

    // minting is always followed by NameWrapper#NameWrapped, safe to ignore
    if (isMint) return;

    // burning is always followed by NameWrapper#NameUnwrapped, safe to ignore
    if (isBurn) return;

    // otherwise is transfer of existing registration

    const domainId = makeENSv1DomainId(tokenIdToNode(tokenId));
    const registration = await getLatestRegistration(context, domainId);
    const isExpired = registration && isRegistrationExpired(registration, event.block.timestamp);

    // Invariant: must have Registration
    if (!registration) {
      throw new Error(
        `Invariant(NameWrapper:Transfer): Registration expected:\n${toJson(registration)}`,
      );
    }

    // Invariant: Expired Registrations are non-transferrable if PCC is set
    const cannotTransferWhileExpired = registration.fuses && isPccFuseSet(registration.fuses);
    if (isExpired && cannotTransferWhileExpired) {
      throw new Error(
        `Invariant(NameWrapper:Transfer): Transfer of expired Registration with PARENT_CANNOT_CONTROL set:\n${toJson(registration)} ${JSON.stringify({ isPccFuseSet: isPccFuseSet(registration.fuses ?? 0) })}`,
      );
    }

    // now guaranteed to be an unexpired transferrable Registration
    // so materialize domain owner
    await materializeDomainOwner(context, domainId, to);
  }

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:NameWrapped"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        name: DNSEncodedName;
        owner: Address;
        fuses: number;
        expiry: bigint;
      }>;
    }) => {
      const { node, name: _name, owner, fuses, expiry: _expiration } = event.args;
      const expiration = interpretExpiration(_expiration);
      const name = _name as DNSEncodedLiteralName;

      const registrar = getThisAccountId(context, event);
      const domainId = makeENSv1DomainId(node);

      // decode name and discover labels
      try {
        const labels = decodeDNSEncodedLiteralName(name);
        for (const label of labels) {
          await ensureLabel(context, label);
        }
      } catch {
        // NameWrapper emitted malformed name? just warn and move on
        console.warn(`NameWrapper emitted malformed DNSEncodedName: '${name}'`);
      }

      const registration = await getLatestRegistration(context, domainId);
      const isFullyExpired =
        registration && isRegistrationFullyExpired(registration, event.block.timestamp);

      // materialize domain owner
      await materializeDomainOwner(context, domainId, owner);

      // handle wraps of direct-subname-of-registrar-managed-names
      if (registration && !isFullyExpired && registration.type === "BaseRegistrar") {
        const managedNode = namehash(getRegistrarManagedName(getThisAccountId(context, event)));

        // Invariant: Emitted name is a direct subname of the RegistrarManagedName
        if (!isDirectSubnameOfRegistrarManagedName(managedNode, name, node)) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): An unexpired BaseRegistrar Registration was found, but the name in question is NOT a direct subname of this NameWrapper's BaseRegistrar's RegistrarManagedName — wtf?`,
          );
        }

        // Invariant: Cannot wrap grace period names
        if (isRegistrationInGracePeriod(registration, event.block.timestamp)) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): Cannot wrap direct-subname-of-registrar-managed-names in GRACE_PERIOD \n${toJson(registration)}`,
          );
        }

        // Invariant: cannot re-wrap, right? NameWrapped -> NameUnwrapped -> NameWrapped
        if (registration.wrapped) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): Re-wrapping already wrapped BaseRegistrar registration\n${toJson(registration)}`,
          );
        }

        // Invariant: BaseRegistrar always provides Expiration
        if (expiration === null) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): Wrap of BaseRegistrar Registration does not include expiration!\n${toJson(registration)}`,
          );
        }

        // Invariant: Expiration Alignment
        if (
          // If BaseRegistrar Registration has an expiration,
          registration.expiration &&
          // The NameWrapper epiration must be greater than that (+ grace period).
          expiration > registration.expiration + (registration.gracePeriod ?? 0n)
        ) {
          throw new Error("Wrapper expiry exceeds registrar expiry + grace period");
        }

        await context.db.update(schema.registration, { id: registration.id }).set({
          wrapped: true,
          fuses,
          // expiration, // TODO: NameWrapper expiration logic
        });
      } else {
        // Invariant: If there's an existing Registration, it should be expired
        if (registration && !isFullyExpired) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): NameWrapped but there's an existing unexpired non-BaseRegistrar Registration:\n${toJson({ registration, timestamp: event.block.timestamp })}`,
          );
        }

        const isAlreadyExpired = expiration && expiration <= event.block.timestamp;
        if (isAlreadyExpired) {
          console.warn(`Creating NameWrapper registration for already-expired name: ${node}`);
        }

        // supercede the latest Registration if exists
        if (registration) {
          await supercedeLatestRegistration(context, registration);
        }

        const nextIndex = registration ? registration.index + 1 : 0;
        const registrationId = makeLatestRegistrationId(domainId);

        // insert NameWrapper Registration
        await context.db.insert(schema.registration).values({
          id: registrationId,
          index: nextIndex,
          type: "NameWrapper",
          registrarChainId: registrar.chainId,
          registrarAddress: registrar.address,
          domainId,
          start: event.block.timestamp,
          fuses,
          expiration,
        });
      }
    },
  );

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:NameUnwrapped"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; owner: Address }>;
    }) => {
      const { node } = event.args;

      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);

      if (!registration) {
        throw new Error(`Invariant(NameWrapper:NameUnwrapped): Registration expected`);
      }

      if (registration.type === "BaseRegistrar") {
        // if this is a wrapped BaseRegisrar Registration, unwrap it
        await context.db.update(schema.registration, { id: registration.id }).set({
          wrapped: false,
          fuses: null,
          // expiration: null // TODO: NameWrapper expiration logic? maybe nothing to do here
        });
      } else {
        // otherwise, deactivate the latest registration by setting its expiry to this block
        await context.db.update(schema.registration, { id: registration.id }).set({
          expiration: event.block.timestamp,
        });
      }

      // NOTE: we don't need to adjust Domain.ownerId because NameWrapper always calls ens.setOwner
    },
  );

  /**
   * FusesSet can occur for expired or unexpired Registrations.
   */
  ponder.on(
    namespaceContract(pluginName, "NameWrapper:FusesSet"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; fuses: number }>;
    }) => {
      const { node, fuses } = event.args;

      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);

      // Invariant: must have a Registration
      if (!registration) {
        throw new Error(
          `Invariant(NameWrapper:FusesSet): Registration expected:\n${toJson(registration)}`,
        );
      }

      // upsert fuses
      await context.db.update(schema.registration, { id: registration.id }).set({
        fuses,
        // expiration: // TODO: NameWrapper expiration logic ?
      });
    },
  );

  /**
   * ExpiryExtended can occur for expired or unexpired Registrations.
   */
  ponder.on(
    namespaceContract(pluginName, "NameWrapper:ExpiryExtended"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; expiry: bigint }>;
    }) => {
      const { node, expiry: _expiration } = event.args;
      const expiration = interpretExpiration(_expiration);

      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);

      // Invariant: must have Registration
      if (!registration) {
        throw new Error(
          `Invariant(NameWrapper:ExpiryExtended): Registration expected\n${toJson(registration)}`,
        );
      }

      await context.db.update(schema.registration, { id: registration.id }).set({ expiration });
    },
  );

  ponder.on(namespaceContract(pluginName, "NameWrapper:TransferSingle"), handleTransfer);
  ponder.on(
    namespaceContract(pluginName, "NameWrapper:TransferBatch"),
    async ({ context, event }) => {
      for (const id of event.args.ids) {
        await handleTransfer({
          context,
          event: { ...event, args: { ...event.args, id } },
        });
      }
    },
  );
}
