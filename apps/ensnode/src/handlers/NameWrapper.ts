import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { checkPccBurned } from "@ensdomains/ensjs/utils";
import { decodeDNSPacketBytes, uint256ToHex32 } from "@ensnode/utils/subname-helpers";
import type { Node } from "@ensnode/utils/types";
import { type Address, type Hex, hexToBytes, namehash } from "viem";
import { createSharedEventValues, upsertAccount } from "../lib/db-helpers";
import { makeEventId } from "../lib/ids";
import { bigintMax } from "../lib/lib-helpers";
import { EventWithArgs } from "../lib/ponder-helpers";
import type { OwnedName } from "../lib/types";

/**
 * When a name is wrapped in the NameWrapper contract, an ERC1155 token is minted that tokenizes
 * ownership of the name. The minted token will be assigned a unique tokenId represented as
 * uint256(namehash(name)) where name is the fully qualified ENS name being wrapped.
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/wrapper/ERC1155Fuse.sol#L262
 */
const tokenIdToNode = (tokenId: bigint): Node => uint256ToHex32(tokenId);

// if the wrappedDomain has PCC set in fuses, set domain's expiryDate to the greatest of the two
async function materializeDomainExpiryDate(context: Context, node: Node) {
  const wrappedDomain = await context.db.find(schema.wrappedDomain, {
    id: node,
  });
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
 * makes a set of shared handlers for the NameWrapper contract for a given registry's `ownedName`
 *
 * @param ownedName the name that the Registry that NameWrapper interacts with manages
 */
export const makeNameWrapperHandlers = (ownedName: OwnedName) => {
  const ownedSubnameNode = namehash(ownedName);
  const sharedEventValues = createSharedEventValues(ownedName);

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
    await context.db
      .insert(schema.wrappedTransfer)
      .values({
        ...sharedEventValues(event),
        id: eventId, // NOTE: override the shared id in this case, to account for TransferBatch
        domainId: node,
        ownerId: to,
      })
      .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
  }

  return {
    async handleNameWrapped({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        node: Node;
        owner: Hex;
        fuses: number;
        expiry: bigint;
        name: Hex;
      }>;
    }) {
      const { node, owner, fuses, expiry } = event.args;

      await upsertAccount(context, owner);

      // decode the name emitted by NameWrapper
      const [label, name] = decodeDNSPacketBytes(hexToBytes(event.args.name));

      // upsert the healed name iff valid
      if (label) {
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
      await context.db
        .insert(schema.nameWrapped)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          name,
          fuses,
          ownerId: owner,
          expiryDate: expiry,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNameUnwrapped({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ node: Node; owner: Hex }>;
    }) {
      const { node, owner } = event.args;

      await upsertAccount(context, owner);

      await context.db.update(schema.domain, { id: node }).set((domain) => ({
        // null expiry date if the domain is not a direct child of .eth
        // via https://github.com/ensdomains/ens-subgraph/blob/c844791/src/nameWrapper.ts#L123
        expiryDate: domain.parentId !== ownedSubnameNode ? null : domain.expiryDate,
        wrappedOwnerId: null,
      }));

      // delete the WrappedDomain
      await context.db.delete(schema.wrappedDomain, { id: node });

      // log DomainEvent
      await context.db
        .insert(schema.nameUnwrapped)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          ownerId: owner,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.fusesSet)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          fuses,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
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
      await context.db
        .insert(schema.expiryExtended)
        .values({
          ...sharedEventValues(event),
          domainId: node,
          expiryDate: expiry,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },
    async handleTransferSingle({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ id: bigint; to: Hex }>;
    }) {
      await handleTransfer(
        context,
        event,
        makeEventId(ownedName, event.block.number, event.log.logIndex, 0),
        event.args.id,
        event.args.to,
      );
    },
    async handleTransferBatch({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ ids: readonly bigint[]; to: Hex }>;
    }) {
      for (const [i, id] of event.args.ids.entries()) {
        await handleTransfer(
          context,
          event,
          makeEventId(ownedName, event.block.number, event.log.logIndex, i),
          id,
          event.args.to,
        );
      }
    },
  };
};
