import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, isAddressEqual, zeroAddress } from "viem";

import {
  type DNSEncodedLiteralName,
  type DNSEncodedName,
  type DomainId,
  decodeDNSEncodedLiteralName,
  makeENSv1DomainId,
  makeRegistrationId,
  type Node,
  PluginName,
  RegistrationId,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import { ensureAccount } from "@/lib/ensv2/account-db-helpers";
import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
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

// namewrapper registration does not have a registrant
// probably need an isSubnameOfRegistrarManagedName helper to identify .eth 2lds (and linea 2lds)
// in the namewrapper and then affect the registration managed by those contracts instead of the
// one managed by the namewrapper.
// so if it's wrapped in the namewrapper, much like the chain, changes are materialized back to the
// source

async function getLatestRegistration(context: Context, domainId: DomainId) {
  const registrationId = makeRegistrationId(domainId, 0);
  return await context.db.find(schema.registration, { id: registrationId });
}

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
    const { id: tokenId, to } = event.args;

    const isBurn = isAddressEqual(zeroAddress, to);
    // burning is always followed by NameWrapper#NameUnwrapped
    if (isBurn) return;

    const domainId = makeENSv1DomainId(tokenIdToNode(tokenId));
    const registration = await getLatestRegistration(context, domainId);

    // ignore NameWrapper#Transfer* events if there's no Registration for the Domain in question
    // this allows us to ignore the first Transfer event that occurs when wrapping a token
    // TODO: if !registration || !isActive(registration)
    if (!registration) return;

    // 1. the domain derived from token id definitely exists
    // 2. its definitely in the namewrapper
    // 3. therefore materialize Domain.ownerId
    await ensureAccount(context, to);
    await context.db.update(schema.domain, { id: domainId }).set({ ownerId: to });
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
      const { node, name, owner, fuses, expiry: expiration } = event.args;

      const domainId = makeENSv1DomainId(node);

      const latest = await getLatestRegistration(context, domainId);

      // TODO: latest && isActive(latest)
      if (latest) {
        throw new Error(
          `Invariant(NameWrapper:NameWrapped): NameWrapped emitted but an active registration already exists.`,
        );
      }

      const registrationId = makeRegistrationId(domainId, 0); // TODO: (latest?.index + 1) ?? 0

      await ensureAccount(context, owner);
      await context.db.insert(schema.registration).values({
        id: registrationId,
        type: "NameWrapper",
        registrarChainId: context.chain.id,
        registrarAddress: event.log.address,
        domainId,
        start: event.block.timestamp,
        fuses,
        expiration,
      });

      // materialize domain owner
      await ensureAccount(context, owner);
      await context.db.update(schema.domain, { id: domainId }).set({ ownerId: owner });

      // decode name and discover labels
      try {
        const labels = decodeDNSEncodedLiteralName(name as DNSEncodedLiteralName);
        for (const label of labels) {
          await ensureLabel(context, label);
        }
      } catch {
        // NameWrapper name decoding failed, no-op
        console.warn(`NameWrapper emitted malformed DNSEncoded Name: '${name}'`);
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
      const { node, owner } = event.args;

      const domainId = makeENSv1DomainId(node);
      const latest = await getLatestRegistration(context, domainId);

      if (!latest) {
        throw new Error(`Invariant(NameWrapper:NameUnwrapped): Registration expected`);
      }

      // TODO: instead of deleting, mark it as inactive perhaps by setting its expiry to block.timestamp
      await context.db.delete(schema.registration, { id: latest.id });

      // NOTE: we don't need to adjust Domain.ownerId because NameWrapper calls ens.setOwner
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

      // TODO: || !isActive(registration)
      if (!registration) {
        throw new Error(`Invariant(NameWrapper:FusesSet): Registration expected.`);
      }

      // upsert fuses
      await context.db.update(schema.registration, { id: registration.id }).set({ fuses });

      // TODO: expiration-related logic?
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

      // TODO: || !isActive(registration)
      if (!registration) {
        throw new Error(`Invariant(NameWrapper:FusesSet): Registration expected.`);
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
