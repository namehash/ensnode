import { type Context } from "ponder:registry";
import { domains, registrations } from "ponder:schema";
import { type Hex, namehash } from "viem";
import { isLabelValid, makeSubnodeNamehash, tokenIdToLabel } from "../lib/ens-helpers";
import { upsertAccount, upsertRegistration } from "../lib/upserts";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * A factory function that returns Ponder indexing handlers for a specified index name/subname.
 */
export const makeRegistryHandlers = (managedSubname: `${string}eth`) => {
  const managedSubnameNode = namehash(managedSubname);

  async function setNamePreimage(context: Context, name: string, label: Hex, cost: bigint) {
    if (!isLabelValid(name)) return;

    const node = makeSubnodeNamehash(managedSubnameNode, label);
    const domain = await context.db.find(domains, { id: node });
    if (!domain) throw new Error("domain expected");

    if (domain.labelName !== name) {
      await context.db
        .update(domains, { id: node })
        .set({ labelName: name, name: `${name}${managedSubname}` });
    }

    await context.db.update(registrations, { id: label }).set({ labelName: name, cost });
  }

  return {
    get managedSubnameNode() {
      return managedSubnameNode;
    },

    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: {
        block: { timestamp: bigint };
        args: { id: bigint; owner: Hex; expires: bigint };
      };
    }) {
      const { id, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(managedSubnameNode, label);

      // TODO: materialze labelName via rainbow tables ala Registry.ts
      const labelName = undefined;

      await upsertRegistration(context, {
        id: label,
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
        labelName,
      });

      await context.db.update(domains, { id: node }).set({
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
        labelName,
      });

      // TODO: log Event
    },

    async handleNameRegisteredByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      return await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewedByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Hex; cost: bigint };
    }) {
      return await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewed({
      context,
      event,
    }: {
      context: Context;
      event: {
        args: { id: bigint; expires: bigint };
      };
    }) {
      const { id, expires } = event.args;

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(managedSubnameNode, label);

      await context.db.update(registrations, { id: label }).set({ expiryDate: expires });

      await context.db
        .update(domains, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // TODO: log Event
    },

    async handleNameTransferred({
      context,
      args: { tokenId, from, to },
    }: {
      context: Context;
      args: {
        tokenId: bigint;
        from: Hex;
        to: Hex;
      };
    }) {
      await upsertAccount(context, to);

      const label = tokenIdToLabel(tokenId);
      const node = makeSubnodeNamehash(managedSubnameNode, label);

      const registration = await context.db.find(registrations, { id: label });
      if (!registration) return;

      await context.db.update(registrations, { id: label }).set({ registrantId: to });

      await context.db.update(domains, { id: node }).set({ registrantId: to });

      // TODO: log Event
    },
  };
};
