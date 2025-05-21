import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, namehash } from "viem";

import {
  type Label,
  type LabelHash,
  PluginName,
  isLabelIndexable,
  makeSubdomainNode,
} from "@ensnode/utils";

import { makeSharedEventValues, upsertAccount, upsertRegistration } from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeRegistrationId } from "@/lib/ids";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import type { RegistrarManagedName } from "@/lib/types";

const GRACE_PERIOD_SECONDS = 7776000n; // 90 days in seconds

/**
 * makes a set of shared handlers for a Registrar contract that registers subnames of `registrarManagedName`
 *
 * @param pluginName the name of the plugin using these shared handlers
 * @param registrarManagedName the name that the Registrar contract indexes subnames of
 */
export const makeRegistrarHandlers = ({
  pluginName,
  registrarManagedName,
}: {
  pluginName: PluginName;
  registrarManagedName: RegistrarManagedName;
}) => {
  const sharedEventValues = makeSharedEventValues(pluginName);
  const registrarManagedNode = namehash(registrarManagedName);

  async function setNamePreimage(
    context: Context,
    label: Label,
    labelHash: LabelHash,
    cost: bigint,
  ) {
    // if the label is otherwise un-indexable, ignore it (see isLabelIndexable for context)
    if (!isLabelIndexable(label)) return;

    const node = makeSubdomainNode(labelHash, registrarManagedNode);
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

      const node = makeSubdomainNode(labelHash, registrarManagedNode);

      // attempt to heal the label via ENSRainbow
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
      const healedLabel = await labelByLabelHash(labelHash);

      // only update the label if it is healed & indexable
      // undefined value means no change to the label
      const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

      // only update the name if the label is healed & indexable
      // undefined value means no change to the name
      const name = validLabel ? `${validLabel}.${registrarManagedName}` : undefined;

      // NOTE: because the mainnet ENS contract _always_ emit Registry#NewOwner _before_
      // Registrar#NameRegistered, the subgraph logic expects a domain entity to exist here.
      //
      // Basenames, however, supports the concept of 'preminting' a domain using a `registerOnly`
      // method which avoids actually registering the name in the Registry and emitting NewOwner.
      // https://github.com/base/basenames/blob/d00f71d822394cfaeab5aa7aded8225ef1292acc/src/L2/BaseRegistrar.sol#L248
      // https://github.com/base/basenames/blob/d00f71d822394cfaeab5aa7aded8225ef1292acc/script/premint/Premint.s.sol#L36
      //
      // Because of this, preminted names emit just the Transfer and Registrar#NameRegisteredWithRecord events.
      // ex: https://basescan.org/tx/0xa61fc930ecf12cfaf247b315c9af50196d86f4276ed1cb93fee48b58a370cc25#eventlog
      //
      // To allow this shared Registrar handler logic work for each of these two patterns, we allow
      // for just the creation of the Registration, skipping the domain.update, but only for the
      // Basenames plugin. If/when these 'preminted' names are actually registered in the future,
      // they will emit NewOwner as expected.
      let domain = await context.db.find(schema.domain, { id: node });
      if (domain) {
        // update of domain's registrant & expiryDate if it exists
        await context.db.update(schema.domain, { id: node }).set({
          registrantId: owner,
          expiryDate: expires + GRACE_PERIOD_SECONDS,
          labelName: validLabel,
          name,
        });
      } else {
        // invariant: if the domain does not exist, this must be a `registerOnly` 'preminted' name
        // in the Basenames plugin, otherwise panic
        if (pluginName !== PluginName.Basenames) {
          throw new Error(
            `Invariant: Registrar#NameRegistered was emitted before Registry#NewOwner and a Domain entity does not yet exist. This indicates that a name was registered in the Registrar but _not_ in the ENS Registry (i.e. 'preminted'). Currently this is only supported on Basenames, but this occurred in plugin '${pluginName}'.`,
          );
        }

        // implicit: avoid updating the domain entity (that does not exist) for 'preminted' names
      }

      // upsert registration
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L64
      const registrationId = makeRegistrationId(pluginName, labelHash, node);
      await upsertRegistration(context, {
        id: registrationId,
        // NOTE: always set domainId (cannot be null), but for preminted names the relationship will be null
        domainId: node,
        registrationDate: event.block.timestamp,
        expiryDate: expires,
        registrantId: owner,
        labelName: validLabel,
      });

      // log RegistrationEvent
      await context.db.insert(schema.nameRegistered).values({
        ...sharedEventValues(context.network.chainId, event),
        registrationId,
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
        // NOTE: `name` event arg actually represents a `Label`
        name: Label;
        // NOTE: `label` event arg actually represents a `LabelHash`
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
      event: EventWithArgs<{
        // NOTE: `name` event arg actually represents a `Label`
        name: Label;
        // NOTE: `label` event arg actually represents a `LabelHash`
        label: LabelHash;
        cost: bigint;
      }>;
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

      const node = makeSubdomainNode(labelHash, registrarManagedNode);
      const id = makeRegistrationId(pluginName, labelHash, node);

      // update Registration expiry
      await context.db.update(schema.registration, { id }).set({ expiryDate: expires });

      // update Domain expiry
      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // log RegistrationEvent
      await context.db.insert(schema.nameRenewed).values({
        ...sharedEventValues(context.network.chainId, event),
        registrationId: id,
        expiryDate: expires,
      });
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

      const node = makeSubdomainNode(labelHash, registrarManagedNode);
      const id = makeRegistrationId(pluginName, labelHash, node);

      const registration = await context.db.find(schema.registration, { id });
      if (!registration) return;

      // update registrants
      await context.db.update(schema.registration, { id }).set({ registrantId: to });
      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // log RegistrationEvent
      await context.db.insert(schema.nameTransferred).values({
        ...sharedEventValues(context.network.chainId, event),
        registrationId: id,
        newOwnerId: to,
      });
    },
  };
};
