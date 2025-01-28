import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import {
  isLabelIndexable,
  makeSubnodeNamehash,
  tokenIdToLabel,
} from "ensnode-utils/subname-helpers";
import type { Labelhash } from "ensnode-utils/types";
import { Block } from "ponder";
import { type Hex, labelhash, namehash } from "viem";
import { upsertAccount, upsertRegistration } from "../lib/db-helpers";
import { makeRegistrationId } from "../lib/ids";
import type { OwnedName } from "../lib/types";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * A factory function that returns Ponder indexing handlers for a specified subname.
 */
export const makeRegistrarHandlers = (ownedName: OwnedName) => {
  const ownedSubnameNode = namehash(ownedName);

  async function setNamePreimage(context: Context, name: string, label: Hex, cost: bigint) {
    // NOTE: ponder intentionally removes null bytes to spare users the footgun of
    // inserting null bytes into postgres. We don't like this behavior, though, because it's
    // important that 'vitalik\x00'.eth and vitalik.eth are differentiable.
    // https://github.com/ponder-sh/ponder/issues/1456
    // So here we use the labelhash fn to determine whether ponder modified our `name` argument,
    // in which case we know that it used to have null bytes in it, and we should ignore it.
    const didHaveNullBytes = labelhash(name) !== label;
    if (didHaveNullBytes) return;

    // if the label is otherwise un-indexable, ignore it (see isLabelIndexable comment for context)
    if (!isLabelIndexable(name)) return;

    const node = makeSubnodeNamehash(ownedSubnameNode, label);
    const domain = await context.db.find(schema.domain, { id: node });

    // encode the runtime assertion here https://github.com/ensdomains/ens-subgraph/blob/master/src/ethRegistrar.ts#L101
    if (!domain) throw new Error("domain expected in setNamePreimage but not found");

    if (domain.labelName !== name) {
      await context.db
        .update(schema.domain, { id: node })
        .set({ labelName: name, name: `${name}.${ownedName}` });
    }

    await context.db
      .update(schema.registration, {
        id: makeRegistrationId(ownedName, label, node),
      })
      .set({ labelName: name, cost });
  }

  return {
    get ownedSubnameNode() {
      return ownedSubnameNode;
    },

    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: {
        block: Block;
        args: { id: bigint; owner: Hex; expires: bigint };
      };
    }) {
      const { id, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const label = tokenIdToLabel(id);
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      // TODO: materialze labelName via rainbow tables ala Registry.ts
      const labelName = undefined;

      await upsertRegistration(context, {
        id: makeRegistrationId(ownedName, label, node),
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
        labelName,
      });

      await context.db.update(schema.domain, { id: node }).set({
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
      args: { name: string; label: Labelhash; cost: bigint };
    }) {
      await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewedByController({
      context,
      args: { name, label, cost },
    }: {
      context: Context;
      args: { name: string; label: Labelhash; cost: bigint };
    }) {
      await setNamePreimage(context, name, label, cost);
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
      const node = makeSubnodeNamehash(ownedSubnameNode, label);

      await context.db
        .update(schema.registration, {
          id: makeRegistrationId(ownedName, label, node),
        })
        .set({ expiryDate: expires });

      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // TODO: log Event
    },

    async handleNameTransferred({
      context,
      args: { tokenId, to },
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
      const node = makeSubnodeNamehash(ownedSubnameNode, label);
      const registrationId = makeRegistrationId(ownedName, label, node);

      const registration = await context.db.find(schema.registration, {
        id: registrationId,
      });
      if (!registration) return;

      await context.db
        .update(schema.registration, { id: registrationId })
        .set({ registrantId: to });

      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // TODO: log Event
    },
  };
};
