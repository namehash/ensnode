import { type Context, type Event, type EventNames } from "ponder:registry";
import { domains, wrappedDomains } from "ponder:schema";
import { checkPccBurned } from "@ensdomains/ensjs/utils";
import { type Address, type Hex, hexToBytes, namehash } from "viem";
import { bigintMax } from "../lib/helpers";
import { makeEventId } from "../lib/ids";
import { decodeDNSPacketBytes, tokenIdToLabel } from "../lib/subname-helpers";
import { upsertAccount } from "../lib/upserts";

// if the wrappedDomain in question has pcc burned (?) and a higher (?) expiry date, update the domain's expiryDate
async function materializeDomainExpiryDate(context: Context, node: Hex) {
  const wrappedDomain = await context.db.find(wrappedDomains, { id: node });
  if (!wrappedDomain) throw new Error(`Expected WrappedDomain(${node})`);

  // NOTE: the subgraph has a helper function called [checkPccBurned](https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L63)
  // which is the exact INVERSE of the ensjs util of the same name. the subgraph's name is _incorrect_
  // because it returns true if the PCC is SET _not_ burned
  // make sure to remember that if you compare the logic in this function to the original subgraph logic [here](https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L87)

  // do not update expiry if PCC is burned
  if (checkPccBurned(BigInt(wrappedDomain.fuses))) return;

  // update the domain's expiry to the greater of the two
  await context.db.update(domains, { id: node }).set((domain) => ({
    expiryDate: bigintMax(domain.expiryDate ?? 0n, wrappedDomain.expiryDate),
  }));
}

async function handleTransfer(
  context: Context,
  event: Event<EventNames>,
  eventId: string,
  tokenId: bigint,
  to: Address,
) {
  await upsertAccount(context, to);
  const node = tokenIdToLabel(tokenId);

  // TODO: remove this if it never fires: subgraph upserts domain but shouldn't be necessary
  const domain = await context.db.find(domains, { id: node });
  if (!domain) {
    console.log("NameWrapper:handleTransfer called before domain existed");
    console.table({ ...event.args, node });
  }

  // upsert the WrappedDomain, only changing owner iff exists
  await context.db
    .insert(wrappedDomains)
    .values({
      id: node,
      ownerId: to,
      domainId: node,

      // placeholders until we get the NameWrapped event
      expiryDate: 0n,
      fuses: 0,
    })
    .onConflictDoUpdate({
      ownerId: to,
    });

  // TODO: log WrappedTransfer
}

export const makeRegistryHandlers = (ownedName: `${string}eth`) => {
  const ownedSubnameNode = namehash(ownedName);

  return {
    async handleNameWrapped({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: {
          node: Hex;
          owner: Hex;
          fuses: number;
          expiry: bigint;
          name: Hex;
        };
      };
    }) {
      const { node, owner, fuses, expiry } = event.args;

      await upsertAccount(context, owner);

      // decode the name emitted by NameWrapper
      const [label, name] = decodeDNSPacketBytes(hexToBytes(event.args.name));

      // upsert the healed name iff valid
      if (label) {
        await context.db.update(domains, { id: node }).set({ labelName: label, name });
      }

      // update the WrappedDomain that was created in handleTransfer
      await context.db.update(wrappedDomains, { id: node }).set({
        name,
        expiryDate: expiry,
        fuses,
      });

      // materialize wrappedOwner relation
      await context.db.update(domains, { id: node }).set({ wrappedOwnerId: owner });

      // materialize domain expiryDate
      await materializeDomainExpiryDate(context, node);

      // TODO: log NameWrapped
    },

    async handleNameUnwrapped({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: {
          node: Hex;
          owner: Hex;
        };
      };
    }) {
      const { node, owner } = event.args;

      await upsertAccount(context, owner);

      await context.db.update(domains, { id: node }).set((domain) => ({
        // null expiry date if the domain is not a direct child of .eth
        // https://github.com/ensdomains/ens-subgraph/blob/master/src/nameWrapper.ts#L123
        ...(domain.expiryDate && domain.parentId !== ownedSubnameNode && { expiryDate: null }),
        ownerId: owner,
        wrappedOwnerId: null,
      }));

      // delete the WrappedDomain
      await context.db.delete(wrappedDomains, { id: node });

      // TODO: log NameUnwrapped
    },

    async handleFusesSet({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: {
          node: Hex;
          fuses: number;
        };
      };
    }) {
      const { node, fuses } = event.args;

      // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
      // we will be more explicit and update logic if necessary
      await context.db.update(wrappedDomains, { id: node }).set({ fuses });
    },
    async handleExpiryExtended({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: {
          node: Hex;
          expiry: bigint;
        };
      };
    }) {
      const { node, expiry } = event.args;

      // NOTE: subgraph does an implicit ignore if no WrappedDomain record.
      // we will be more explicit and update logic if necessary
      await context.db.update(wrappedDomains, { id: node }).set({ expiryDate: expiry });

      // materialize the domain's expiryDate
      await materializeDomainExpiryDate(context, node);

      // TODO: log ExpiryExtended
    },
    async handleTransferSingle({
      context,
      event,
    }: {
      context: Context;
      event: Event<EventNames> & {
        args: {
          id: bigint;
          to: Hex;
        };
      };
    }) {
      await handleTransfer(context, event, makeEventId(event, 0), event.args.id, event.args.to);
    },
    async handleTransferBatch({
      context,
      event,
    }: {
      context: Context;
      event: Event<EventNames> & {
        args: {
          ids: readonly bigint[];
          to: Hex;
        };
      };
    }) {
      for (const [i, id] of event.args.ids.entries()) {
        await handleTransfer(context, event, makeEventId(event, i), id, event.args.to);
      }
    },
  };
};
