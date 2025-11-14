import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, labelhash, namehash, zeroAddress } from "viem";

import {
  type DNSEncodedLiteralName,
  type DNSEncodedName,
  decodeDNSEncodedLiteralName,
  type LiteralLabel,
  makeENSv1DomainId,
  makeRegistrationId,
  makeSubdomainNode,
  type Node,
  PluginName,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import { materializeDomainOwner } from "@/lib/ensv2/domain-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import { getRegistrarManagedName } from "@/lib/ensv2/registrar-lib";
import { getLatestRegistration, isRegistrationActive } from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
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

// registrar is source of truth for expiry if eth 2LD
// otherwise namewrapper is registrar and source of truth for expiry
// maybe should more or less ignore .eth 2LD (and other registrar-managed names) in the namewrapper?

// for non-.eth-2ld names is infinite expiration represented as 0 or max int? probably max int. if so
// need to interpret that into null to indicate that it doesn't expire
// for .eth 2lds we need any namewrapper events to be, like, ignored, basically. maybe a BaseRegistrar
// Registration can include a `wrappedTokenId` field to indicate that it exists in the namewrapper
// but NameWrapper Registrations are exclusively for non-.eth-2lds

// namewrapper registration does not have a registrant
// probably need an isSubnameOfRegistrarManagedName helper to identify .eth 2lds (and linea 2lds)
// in the namewrapper and then affect the registration managed by those contracts instead of the
// one managed by the namewrapper.
// so if it's wrapped in the namewrapper, much like the chain, changes are materialized back to the
// source

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
  const leaf = labelhash(labels[0]!);
  const expectedNode = makeSubdomainNode(leaf, managedNode);

  // Nodes must exactly match
  return node === expectedNode;
};

export default function () {
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

    const domainId = makeENSv1DomainId(tokenIdToNode(tokenId));
    const registration = await getLatestRegistration(context, domainId);
    const isActive = isRegistrationActive(registration, event.block.timestamp);

    // Invariant: must have active Registration
    if (!registration || !isActive) {
      throw new Error(`Invariant(NameWrapper:Transfer): Active Registration expected.`);
    }

    // materialize domain owner
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
      const { node, name: _name, owner, fuses, expiry: expiration } = event.args;
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
        // NameWrapper emitted malformed name? just warn
        console.warn(`NameWrapper emitted malformed DNSEncoded Name: '${name}'`);
      }

      const registration = await getLatestRegistration(context, domainId);
      const isActive = isRegistrationActive(registration, event.block.timestamp);

      // materialize domain owner
      await materializeDomainOwner(context, domainId, owner);

      if (registration && isActive && registration.type === "BaseRegistrar") {
        // if there's an existing active BaseRegistrar registration, this this must be the wrap of a
        // direct-subname-of-registrar-managed-name

        const managedNode = namehash(getRegistrarManagedName(getThisAccountId(context, event)));

        // Invariant: emitted Name is decodable and is a direct subname of the RegistrarManagedName
        if (!isDirectSubnameOfRegistrarManagedName(managedNode, name, node)) {
          throw new Error(
            `Invariant(NameWrapper:NameWrapped): An active BaseRegistrar Registration was found, but the name in question is NOT a direct subname of this NameWrapper's BaseRegistrar's RegistrarManagedName — wtf?`,
          );
        }

        await context.db.update(schema.registration, { id: registration.id }).set({
          wrapped: true,
          wrappedFuses: fuses,
          // expiration, // TODO: NameWrapper expiration logic
        });
      }

      // Invariant: there shouldn't be an active registration
      if (registration && isActive) {
        throw new Error(
          `Invariant(NameWrapper:NameWrapped): NameWrapped but there's an existing active non-BaseRegistrar Registration.`,
        );
      }

      // create a new NameWrapper Registration
      const nextIndex = registration ? registration.index + 1 : 0;
      const registrationId = makeRegistrationId(domainId, nextIndex);
      await context.db.insert(schema.registration).values({
        id: registrationId,
        type: "NameWrapper",
        registrarChainId: registrar.chainId,
        registrarAddress: registrar.address,
        domainId,
        start: event.block.timestamp,
        fuses,
        expiration,
      });
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
          wrappedFuses: null,
          // expiration: null // TODO: NameWrapper expiration logic
        });
      } else {
        // otherwise, deactivate the NameWrapper Registrations
        // TODO: instead of deleting, mark it as inactive perhaps by setting its expiry to block.timestamp
        await context.db.delete(schema.registration, { id: registration.id });
      }

      // NOTE: we don't need to adjust Domain.ownerId because NameWrapper always calls ens.setOwner
    },
  );

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
      const isActive = isRegistrationActive(registration, event.block.timestamp);

      // Invariant: must have active Registration
      if (!registration || !isActive) {
        throw new Error(`Invariant(NameWrapper:FusesSet): Active Registration expected.`);
      }

      // upsert fuses
      if (registration.type === "BaseRegistrar") {
        await context.db.update(schema.registration, { id: registration.id }).set({
          wrappedFuses: fuses,
          // expiration: // TODO: NameWrapper expiration logic
        });
      } else {
        await context.db.update(schema.registration, { id: registration.id }).set({ fuses });
      }
    },
  );

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:ExpiryExtended"),
    async ({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; expiry: bigint }>;
    }) => {
      const { node, expiry: expiration } = event.args;

      const domainId = makeENSv1DomainId(node);
      const registration = await getLatestRegistration(context, domainId);
      const isActive = isRegistrationActive(registration, event.block.timestamp);

      // Invariant: must have active Registration
      if (!registration || !isActive) {
        throw new Error(`Invariant(NameWrapper:ExpiryExtended): Active Registration expected.`);
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
