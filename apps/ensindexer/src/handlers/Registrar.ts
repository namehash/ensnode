import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import {
  isLabelIndexable,
  labelByReverseAddress,
  makeSubnodeNamehash,
} from "@ensnode/utils/subname-helpers";
import type { Labelhash } from "@ensnode/utils/types";
import { type Hex, labelhash as _labelhash, namehash } from "viem";
import { createSharedEventValues, upsertAccount, upsertRegistration } from "../lib/db-helpers";
import { labelByHash } from "../lib/graphnode-helpers";
import { makeRegistrationId } from "../lib/ids";
import type { PonderENSPluginHandlerArgs } from "../lib/plugin-helpers";
import type { EventWithArgs } from "../lib/ponder-helpers";
import type { OwnedName } from "../lib/types";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * makes a set of shared handlers for a Registrar contract that manages `ownedName`
 *
 * @param ownedName the name that the Registrar contract manages subnames of
 */
export const makeRegistrarHandlers = <OWNED_NAME extends OwnedName>({
  canHealReverseAddresses,
  isReverseRootNode,
  ownedName,
}: PonderENSPluginHandlerArgs<OWNED_NAME>) => {
  const ownedNameNode = namehash(ownedName);
  const sharedEventValues = createSharedEventValues(ownedName);

  async function setNamePreimage(
    context: Context,
    name: string,
    labelhash: Labelhash,
    cost: bigint,
  ) {
    // NOTE: ponder intentionally removes null bytes to spare users the footgun of
    // inserting null bytes into postgres. We don't like this behavior, though, because it's
    // important that 'vitalik\x00'.eth and vitalik.eth are differentiable.
    // https://github.com/ponder-sh/ponder/issues/1456
    // So here we use the labelhash fn to determine whether ponder modified our `name` argument,
    // in which case we know that it used to have null bytes in it, and we should ignore it.
    const didHaveNullBytes = _labelhash(name) !== labelhash;
    if (didHaveNullBytes) return;

    // if the label is otherwise un-indexable, ignore it (see isLabelIndexable for context)
    if (!isLabelIndexable(name)) return;

    const node = makeSubnodeNamehash(ownedNameNode, labelhash);
    const domain = await context.db.find(schema.domain, { id: node });

    // encode the runtime assertion here https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L101
    if (!domain) throw new Error("domain expected in setNamePreimage but not found");

    if (domain.labelName !== name) {
      await context.db
        .update(schema.domain, { id: node })
        .set({ labelName: name, name: `${name}.${ownedName}` });
    }

    await context.db
      .update(schema.registration, { id: makeRegistrationId(ownedName, labelhash, node) })
      .set({ labelName: name, cost });
  }

  return {
    // NOTE: provide the ownedSubnameNode back to the plugin constructing these handlers in order
    // to facilitate easier access to the event's `node` value (see plugin handlers for usage)
    get ownedSubnameNode() {
      return ownedNameNode;
    },

    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        labelhash: Labelhash;
        owner: Hex;
        expires: bigint;
      }>;
    }) {
      const { labelhash, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const node = makeSubnodeNamehash(ownedNameNode, labelhash);

      let healedLabel = null;

      // if healing label from reverse addresses is enabled,
      // and the parent node is the reverse root node, give it a go
      if (canHealReverseAddresses() && isReverseRootNode(node)) {
        try {
          healedLabel = labelByReverseAddress({
            reverseAddress: owner,
            labelhash,
          });
        } catch (e) {
          // log the error and continue
          console.error(e);
        }
      }

      // if label hasn't been healed yet
      if (!healedLabel) {
        // attempt to heal the label associated with labelhash via ENSRainbow
        // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
        healedLabel = await labelByHash(labelhash);
      }

      // only update the label if it is healed & indexable
      // undefined value means no change to the label
      const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

      // only update the name if the label is healed & indexable
      // undefined value means no change to the name
      const name = validLabel ? `${validLabel}.${ownedName}` : undefined;

      // update domain's registrant & expiryDate
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L63
      await context.db.update(schema.domain, { id: node }).set({
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
        labelName: validLabel,
        name,
      });

      // update registration
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L64
      const registrationId = makeRegistrationId(ownedName, labelhash, node);
      await upsertRegistration(context, {
        id: registrationId,
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
        labelName: validLabel,
      });

      // log RegistrationEvent
      await context.db
        .insert(schema.nameRegistered)
        .values({
          ...sharedEventValues(event),
          registrationId,
          registrantId: owner,
          expiryDate: expires,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNameRegisteredByController({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        name: string;
        label: Labelhash;
        cost: bigint;
      }>;
    }) {
      const { name, label, cost } = event.args;
      await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewedByController({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ name: string; label: Labelhash; cost: bigint }>;
    }) {
      const { name, label, cost } = event.args;
      await setNamePreimage(context, name, label, cost);
    },

    async handleNameRenewed({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ labelhash: Labelhash; expires: bigint }>;
    }) {
      const { labelhash, expires } = event.args;

      const node = makeSubnodeNamehash(ownedNameNode, labelhash);
      const id = makeRegistrationId(ownedName, labelhash, node);

      // update Registration expiry
      await context.db.update(schema.registration, { id }).set({ expiryDate: expires });

      // update Domain expiry
      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // log RegistrationEvent
      await context.db
        .insert(schema.nameRenewed)
        .values({
          ...sharedEventValues(event),
          registrationId: id,
          expiryDate: expires,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },

    async handleNameTransferred({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ labelhash: Labelhash; from: Hex; to: Hex }>;
    }) {
      const { labelhash, to } = event.args;
      await upsertAccount(context, to);

      const node = makeSubnodeNamehash(ownedNameNode, labelhash);
      const id = makeRegistrationId(ownedName, labelhash, node);

      const registration = await context.db.find(schema.registration, { id });
      if (!registration) return;

      // update registrants
      await context.db.update(schema.registration, { id }).set({ registrantId: to });
      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // log RegistrationEvent
      await context.db
        .insert(schema.nameTransferred)
        .values({
          ...sharedEventValues(event),
          registrationId: id,
          newOwnerId: to,
        })
        .onConflictDoNothing(); // upsert for successful recovery when restarting indexing
    },
  };
};
