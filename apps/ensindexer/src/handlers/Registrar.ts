import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, namehash } from "viem";

import { makeSharedEventValues, upsertAccount, upsertRegistration } from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeRegistrationId } from "@/lib/ids";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import type { EventIdPrefix, PluginName, RegistrarManagedName } from "@/lib/types";
import { Label, type LabelHash } from "@ensnode/utils";
import { isLabelIndexable, makeSubnode } from "@ensnode/utils/subname-helpers";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * makes a set of shared handlers for a Registrar contract that registers subnames of `registrarManagedName`
 *
 * @param eventIdPrefix event id prefix to avoid cross-plugin collisions
 * @param registrarManagedName the name that the Registrar contract manages subnames of
 */
export const makeRegistrarHandlers = ({
  pluginName,
  eventIdPrefix,
  registrarManagedName,
}: {
  pluginName: PluginName;
  eventIdPrefix: EventIdPrefix;
  registrarManagedName: RegistrarManagedName;
}) => {
  const sharedEventValues = makeSharedEventValues(eventIdPrefix);
  const registrarManagedNode = namehash(registrarManagedName);

  async function setNamePreimage(
    context: Context,
    label: Label,
    labelHash: LabelHash,
    cost: bigint,
  ) {
    // if the label is otherwise un-indexable, ignore it (see isLabelIndexable for context)
    if (!isLabelIndexable(label)) return;

    const node = makeSubnode(labelHash, registrarManagedNode);
    const domain = await context.db.find(schema.domain, { id: node });

    // encode the runtime assertion here https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L101
    if (!domain) throw new Error("domain expected in setNamePreimage but not found");

    // update the domain's labelName with label
    if (domain.labelName !== label) {
      await context.db
        .update(schema.domain, { id: node })
        .set({ labelName: label, name: `${label}.${registrarManagedName}` });
    }

    // materialize the registration's labelName as well
    await context.db
      .update(schema.registration, {
        id: makeRegistrationId(pluginName, labelHash, node),
      })
      .set({ labelName: label, cost });
  }

  return {
    async handleNameRegistered({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        labelHash: LabelHash;
        owner: Address;
        expires: bigint;
      }>;
    }) {
      const { labelHash, owner, expires } = event.args;

      await upsertAccount(context, owner);

      const node = makeSubnode(labelHash, registrarManagedNode);

      // attempt to heal the label via ENSRainbow
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
      const healedLabel = await labelByLabelHash(labelHash);

      // only update the label if it is healed & indexable
      // undefined value means no change to the label
      const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

      // only update the name if the label is healed & indexable
      // undefined value means no change to the name
      const name = validLabel ? `${validLabel}.${registrarManagedName}` : undefined;

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
      const registrationId = makeRegistrationId(pluginName, labelHash, node);
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
        name: Label;
        label: LabelHash;
        cost: bigint;
      }>;
    }) {
      const { name: label, label: labelHash, cost } = event.args;
      await setNamePreimage(context, label, labelHash, cost);
    },

    async handleNameRenewedByController({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ name: Label; label: LabelHash; cost: bigint }>;
    }) {
      const { name: label, label: labelHash, cost } = event.args;
      await setNamePreimage(context, label, labelHash, cost);
    },

    async handleNameRenewed({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{ labelHash: LabelHash; expires: bigint }>;
    }) {
      const { labelHash, expires } = event.args;

      const node = makeSubnode(labelHash, registrarManagedNode);
      const id = makeRegistrationId(pluginName, labelHash, node);

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
      event: EventWithArgs<{ labelHash: LabelHash; from: Address; to: Address }>;
    }) {
      const { labelHash, to } = event.args;
      await upsertAccount(context, to);

      const node = makeSubnode(labelHash, registrarManagedNode);
      const id = makeRegistrationId(pluginName, labelHash, node);

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
