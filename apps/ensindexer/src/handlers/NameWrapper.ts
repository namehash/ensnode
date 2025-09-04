import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { checkPccBurned } from "@ensdomains/ensjs/utils";
import { type Address, type Hex, hexToBytes, namehash } from "viem";

import {
  DNSEncodedName,
  InterpretedLabel,
  InterpretedName,
  LiteralDNSEncodedName,
  LiteralLabel,
  LiteralName,
  type Node,
  interpretLiteralLabel,
  literalLabelsToInterpretedName,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

import config from "@/config";
import { sharedEventValues, upsertAccount } from "@/lib/db-helpers";
import { decodeLiteralDNSEncodedName, legacy_decodeDNSPacketBytes } from "@/lib/dns-helpers";
import { makeEventId } from "@/lib/ids";
import { bigintMax } from "@/lib/lib-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import type { RegistrarManagedName } from "@/lib/types";

/**
 * When a name is wrapped in the NameWrapper contract, an ERC1155 token is minted that tokenizes
 * ownership of the name. The minted token will be assigned a unique tokenId represented as
 * uint256(namehash(name)) where name is the fully qualified ENS name being wrapped.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/wrapper/ERC1155Fuse.sol#L262
 */
const tokenIdToNode = (tokenId: bigint): Node => uint256ToHex32(tokenId);

/**
 * Parses the NameWrapper's emitted DNS-Encoded Name `packet` and interprets it into an Interpreted
 * Name.
 *
 * NOTE(replace-unnormalized): ensures that the decoded label/name values are Interpreted
 * @see https://ensnode.io/docs/reference/terminology#interpreted-label
 * @see https://ensnode.io/docs/reference/terminology#interpreted-name
 */
function parseAndInterpretNameWrapperName(packet: LiteralDNSEncodedName): {
  label: InterpretedLabel;
  name: InterpretedName;
} {
  try {
    const literalLabels = decodeLiteralDNSEncodedName(packet);

    if (literalLabels.length === 0) {
      throw new Error(
        `Invariant: NameWrapper emitted ${packet} that decoded to root node (empty string).`,
      );
    }

    return {
      label: interpretLiteralLabel(literalLabels[0]!), // ! ok due to length invariant above
      name: literalLabelsToInterpretedName(literalLabels),
    };
  } catch (error) {
    // malformed packet? no-op and continue with existing behavior (this will result in
    // WrappedDomain.name === null)
    // TODO: if interpreted correctly will there ever by malformed packets? if not can remove possible null type
    throw new Error(`Malformed packet? '${packet}' ${error}`);
  }
}

/**
 * Parses the NameWrapper's emitted DNS-Encoded `name` packet and returns it as a Literal Name.
 */
function parseLiteralNameWrapperName(packet: LiteralDNSEncodedName): {
  label: null | LiteralLabel;
  name: null | LiteralName;
} {
  // NOTE: the NameWrapper may emit malformed dns packets or labels that are not indexable
  // according to `legacy_decodeDNSPacketBytes`: if so, the returned `label` and `name` will be null
  const [label, name] = legacy_decodeDNSPacketBytes(hexToBytes(packet));
  return { label, name };
}

// if the WrappedDomain entity has PCC set in fuses, set Domain entity's expiryDate to the greater of the two
async function materializeDomainExpiryDate(context: Context, node: Node) {
  const wrappedDomain = await context.db.find(schema.wrappedDomain, { id: node });
  if (!wrappedDomain) throw new Error(`Expected WrappedDomain(${node})`);

  // NOTE: the subgraph has a helper function called [checkPccBurned](https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L63)
  // which is the exact INVERSE of the ensjs util of the same name. the subgraph's name is _incorrect_
  // because it returns true if the PCC is SET _not_ burned
  // make sure to remember that if you compare the logic in this function to the original subgraph logic [here](https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L87)
  // related GitHub issue: https://github.com/ensdomains/ens-subgraph/issues/88

  // if PCC is burned (not set), we do not update expiry
  if (checkPccBurned(BigInt(wrappedDomain.fuses))) return;

  // update the domain's expiry to the greater of the two
  await context.db.update(schema.domain, { id: node }).set((domain) => ({
    expiryDate: bigintMax(domain.expiryDate ?? 0n, wrappedDomain.expiryDate),
  }));
}

/**
 * makes a set of shared handlers for the NameWrapper contract
 *
 * @param registrarManagedName the name that the Registrar that NameWrapper interacts with registers subnames of
 */
export const makeNameWrapperHandlers = ({
  registrarManagedName,
}: {
  registrarManagedName: RegistrarManagedName;
}) => {
  const registrarManagedNode = namehash(registrarManagedName);

  async function handleTransfer(
    context: Context,
    event: EventWithArgs,
    eventId: string,
    tokenId: bigint,
    to: Address,
  ) {
    await upsertAccount(context, to);
    const node = tokenIdToNode(tokenId);

    // NOTE: subgraph technically upserts domain with `createOrLoadDomain()` here, but domain
    // is guaranteed to exist. we encode this stricter logic here to illustrate that fact.
    // via https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/nameWrapper.ts#L197C18-L197C36
    const domain = await context.db.find(schema.domain, { id: node });
    if (!domain) {
      console.table({ ...event.args, node });
      throw new Error(`NameWrapper:handleTransfer called before domain '${node}' exists.`);
    }

    // upsert the WrappedDomain
    await context.db
      .insert(schema.wrappedDomain)
      .values({
        id: node,
        ownerId: to,
        domainId: node,

        // placeholders until we get the NameWrapped event
        expiryDate: 0n,
        fuses: 0,
      })
      // if exists, only update owner
      .onConflictDoUpdate({ ownerId: to });

    // materialize `Domain.wrappedOwner`
    await context.db.update(schema.domain, { id: node }).set({ wrappedOwnerId: to });

    // log DomainEvent
    await context.db.insert(schema.wrappedTransfer).values({
      ...sharedEventValues(context.chain.id, event),
      id: eventId, // NOTE: override the shared id in this case, to account for TransferBatch
      domainId: node,
      ownerId: to,
    });
  }

  return {
    async handleNameWrapped({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        owner: Address;
        fuses: number;
        expiry: bigint;
        name: DNSEncodedName;
      }>;
    }) {
      const { node, owner, fuses, expiry } = event.args;

      await upsertAccount(context, owner);

      // NameWrapper emits a LiteralDNSEncodedName, so cast it as such
      const { label, name } = config.replaceUnnormalized
        ? parseAndInterpretNameWrapperName(event.args.name as LiteralDNSEncodedName)
        : parseLiteralNameWrapperName(event.args.name as LiteralDNSEncodedName);

      const domain = await context.db.find(schema.domain, { id: node });
      if (!domain) throw new Error("domain is guaranteed to already exist");

      // upsert the healed name iff !domain.labelName && label
      // NOTE: this means that future wraps of a domain with an EncodedLabelHash in the name
      //   will _not_ use the newly healed label emitted by the NameWrapper contract, and will
      //   continue to have an un-healed EncodedLabelHash in its name field
      // ex: domain id 0x0093b7095a35094ecbd246f5d5638cb094c3061a5f29679f5969ad0abcfae27f
      // https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L83
      if (!domain.labelName && label) {
        await context.db.update(schema.domain, { id: node }).set({ labelName: label, name });
      }

      // update the WrappedDomain that was created in handleTransfer
      await context.db.update(schema.wrappedDomain, { id: node }).set({
        name,
        expiryDate: expiry,
        fuses,
      });

      // materialize wrappedOwner relation
      await context.db.update(schema.domain, { id: node }).set({ wrappedOwnerId: owner });

      // materialize domain expiryDate
      await materializeDomainExpiryDate(context, node);

      // log DomainEvent
      await context.db.insert(schema.nameWrapped).values({
        ...sharedEventValues(context.chain.id, event),
        domainId: node,
        name,
        fuses,
        ownerId: owner,
        expiryDate: expiry,
      });
    },

    async handleNameUnwrapped({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; owner: Address }>;
    }) {
      const { node, owner } = event.args;

      await upsertAccount(context, owner);

      await context.db.update(schema.domain, { id: node }).set((domain) => ({
        // when a WrappedDomain is Unwrapped, reset any PCC-materialized expiryDate on the Domain entity
        // i.e if the domain in question normally has an expiry date (is a direct subname of a
        // Registrar that implements expiries), keep the domain's expiry date, otherwise, set its
        // expiry to null because it does not expire.
        // via https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L123
        // NOTE: undefined = no change, null = null
        expiryDate: domain.parentId === registrarManagedNode ? undefined : null,
        wrappedOwnerId: null,
      }));

      // delete the WrappedDomain
      await context.db.delete(schema.wrappedDomain, { id: node });

      // log DomainEvent
      await context.db.insert(schema.nameUnwrapped).values({
        ...sharedEventValues(context.chain.id, event),
        domainId: node,
        ownerId: owner,
      });
    },

    async handleFusesSet({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; fuses: number }>;
    }) {
      const { node, fuses } = event.args;

      // NOTE: subgraph no-ops this event if there's not a wrappedDomain already in the db.
      // via https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L144
      const wrappedDomain = await context.db.find(schema.wrappedDomain, { id: node });
      if (wrappedDomain) {
        // set fuses
        await context.db.update(schema.wrappedDomain, { id: node }).set({ fuses });

        // materialize the domain's expiryDate because the fuses have potentially changed
        await materializeDomainExpiryDate(context, node);
      }

      // log DomainEvent
      await context.db.insert(schema.fusesSet).values({
        ...sharedEventValues(context.chain.id, event),
        domainId: node,
        fuses,
      });
    },
    async handleExpiryExtended({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; expiry: bigint }>;
    }) {
      const { node, expiry } = event.args;

      // NOTE: subgraph no-ops this event if there's not a wrappedDomain already in the db.
      // https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L169
      const wrappedDomain = await context.db.find(schema.wrappedDomain, { id: node });
      if (wrappedDomain) {
        // update expiryDate
        await context.db.update(schema.wrappedDomain, { id: node }).set({ expiryDate: expiry });

        // materialize the domain's expiryDate
        await materializeDomainExpiryDate(context, node);
      }

      // log DomainEvent
      await context.db.insert(schema.expiryExtended).values({
        ...sharedEventValues(context.chain.id, event),
        domainId: node,
        expiryDate: expiry,
      });
    },
    async handleTransferSingle({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ id: bigint; to: Address }>;
    }) {
      const { id: tokenId, to } = event.args;

      await handleTransfer(
        context,
        event,
        makeEventId(
          context.chain.id,
          event.block.number,
          event.log.logIndex,
          0, // transferIndex
        ),
        tokenId,
        to,
      );
    },
    async handleTransferBatch({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ ids: readonly bigint[]; to: Address }>;
    }) {
      const { ids: tokenIds, to } = event.args;

      for (const [transferIndex, tokenId] of tokenIds.entries()) {
        await handleTransfer(
          context,
          event,
          makeEventId(context.chain.id, event.block.number, event.log.logIndex, transferIndex),
          tokenId,
          to,
        );
      }
    },
  };
};
