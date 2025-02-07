import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { isLabelIndexable, makeSubnodeNamehash } from "ensnode-utils/subname-helpers";
import type { Labelhash } from "ensnode-utils/types";
import { type Hex, labelhash as _labelhash, namehash } from "viem";
import { createSharedEventValues, upsertAccount, upsertRegistration } from "../lib/db-helpers";
import { labelByHash } from "../lib/graphnode-helpers";
import { makeRegistrationId } from "../lib/ids";
import { EventWithArgs } from "../lib/ponder-helpers";
import type { OwnedName } from "../lib/types";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * A factory function that returns Ponder indexing handlers for a specified subname.
 */
export const makeRegistrarHandlers = (ownedName: OwnedName) => {
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

    // if the label is otherwise un-indexable, ignore it (see isLabelIndexable comment for context)
    if (!isLabelIndexable(name)) return;

    const node = makeSubnodeNamehash(ownedNameNode, labelhash);
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
        id: makeRegistrationId(ownedName, labelhash, node),
      })
      .set({ labelName: name, cost });
  }

  return {
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

      // prepare registration entity object
      const registration = {
        id: makeRegistrationId(ownedName, labelhash, node),
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
      } as typeof schema.registration.$inferInsert;

      // prepare domain entity object
      const domain = {
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
      } as Partial<typeof schema.domain.$inferInsert>;

      // attempt to heal the label associated with labelhash via ENSRainbow
      // https://github.com/ensdomains/ens-subgraph/blob/c8447914e8743671fb4b20cffe5a0a97020b3cee/src/ethRegistrar.ts#L56-L61
      const label = await labelByHash(labelhash);
      if (isLabelIndexable(label)) {
        domain.labelName = label;
        domain.name = `${label}.${ownedName}`;
        registration.labelName = label;
      }

      // akin to domain.save()
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889e0bcdc6d45033778faef19b3efe3d15fe/src/ethRegistrar.ts#L63
      await context.db.update(schema.domain, { id: node }).set(domain);
      // akin to registration.save()
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889e0bcdc6d45033778faef19b3efe3d15fe/src/ethRegistrar.ts#L64
      await upsertRegistration(context, registration);

      // log RegistrationEvent
      await context.db.insert(schema.nameRegistered).values({
        ...sharedEventValues(event),
        registrationId: registration.id,
        registrantId: owner,
        expiryDate: expires,
      });
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

      await context.db.update(schema.registration, { id }).set({ expiryDate: expires });

      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // log RegistrationEvent

      await context.db.insert(schema.nameRenewed).values({
        ...sharedEventValues(event),
        registrationId: id,
        expiryDate: expires,
      });
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

      await context.db.update(schema.registration, { id }).set({ registrantId: to });
      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // log RegistrationEvent
      await context.db.insert(schema.nameTransferred).values({
        ...sharedEventValues(event),
        registrationId: id,
        newOwnerId: to,
      });
    },
  };
};
