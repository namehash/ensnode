import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, namehash } from "viem";

import {
  type Label,
  type LabelHash,
  PluginName,
  isLabelIndexable,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";

import { sharedEventValues, upsertAccount, upsertRegistration } from "@/lib/db-helpers";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { makeRegistrationId } from "@/lib/ids";
import { pluginSupportsPremintedNames } from "@/lib/plugin-helpers";
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
        id: makeRegistrationId(labelHash, node),
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

      // NOTE(preminted-names): The mainnet ENS Registrar(s) _always_ register a node with the ENS
      // registry (emitting Registry#NewOwner) before emitting Registrar#NameRegistered.
      //
      // As part of the subgraph semantics, the Domain entity is created within Registry#NewOwner,
      // and that Domain entity is expected to exist during the execution of these subsequent Registrar
      // event handlers. This invariant is valid for the mainnet ENS contracts, which always register
      // names with the Registry and emit the events as expected.
      //
      // This becomes an issue only because some plugins (Basenames, Lineanames) support the concept
      // of 'preminting' a domain: these 'preminted' domains are reserved in the Registrar (which
      // emits Registrar#NameRegistered) but a subname is NOT created in the Registry (which therefore
      // does not emit Registry#NewOwner).
      //
      // https://github.com/base/basenames/blob/d00f71d822394cfaeab5aa7aded8225ef1292acc/src/L2/BaseRegistrar.sol#L248
      // https://github.com/base/basenames/blob/d00f71d822394cfaeab5aa7aded8225ef1292acc/script/premint/Premint.s.sol#L36
      //
      // Preminted names are not 'real' ENS names — they do not exist in the Registry, and so we do
      // not create a Domain entity for them. We also choose not to track their Registration, as that
      // could result in unexpected behavior, when a Registration exists but the associated Domain
      // does not.
      //
      // Therefore, if a Domain does not exist in these Registrar event handlers, it _must_ be a
      // 'preminted' name, tracked only in the Registrar, and we ignore it. If/when these 'preminted'
      // names are actually registered in the future, they will emit NewOwner as expected and the
      // Domain and Registration entities will exist as normal.
      const domain = await context.db.find(schema.domain, { id: node });
      if (!domain) {
        // no-op the NameRegistered event in plugins that explicitly support preminted names
        if (pluginSupportsPremintedNames(pluginName)) return;

        // invariant: if the domain does not exist and the plugin does not support preminted names, panic
        throw new Error(
          `Invariant: Registrar#NameRegistered was emitted before Registry#NewOwner and a Domain entity does not exist for node ${node}. This indicates that a name was registered in the Registrar but _not_ in the ENS Registry (i.e. 'preminted'). Currently this is only supported on Basenames and Lineanames, but this occurred in plugin '${pluginName}'.`,
        );
      }

      // attempt to heal the label via ENSRainbow
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
      const healedLabel = await labelByLabelHash(labelHash);

      // only update the label if it is healed & indexable
      // undefined value means no change to the label
      const validLabel = isLabelIndexable(healedLabel) ? healedLabel : undefined;

      // only update the name if the label is healed & indexable
      // undefined value means no change to the name
      const name = validLabel ? `${validLabel}.${registrarManagedName}` : undefined;

      // update Domain
      await context.db.update(schema.domain, { id: node }).set({
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
        labelName: validLabel,
        name,
      });

      // upsert registration
      // via https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L64
      const registrationId = makeRegistrationId(labelHash, node);
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
        ...sharedEventValues(context.chain.id, event),
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
        label: Label;
        labelHash: LabelHash;
        cost: bigint;
      }>;
    }) {
      // NOTE(preminted-names): no special handling is needed here: this handler is not used by
      // the plugins that support preminted names

      const { label, labelHash, cost } = event.args;
      await setNamePreimage(context, label, labelHash, cost);
    },

    async handleNameRenewedByController({
      context,
      event,
    }: {
      context: Context;
      event: EventWithArgs<{
        label: Label;
        labelHash: LabelHash;
        cost: bigint;
      }>;
    }) {
      // NOTE(preminted-names): no special handling is needed here: this handler is not used by
      // the plugins that support preminted names

      const { label, labelHash, cost } = event.args;
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
      const id = makeRegistrationId(labelHash, node);

      // NOTE(preminted-names): 'preminted' names (names that are regsitered in a Registrar but
      // NOT registered in the ENS Registry) can be renewed, extending their expiry in the Registrar.
      //
      // In the event that the Domain entity does not exist, this must be a preminted name, and
      // we enforce that this codepath can only execute in the context of plugins whose indexed
      // contracts implement 'preminting' names.
      const domain = await context.db.find(schema.domain, { id: node });
      if (!domain) {
        // no-op the NameRenewed event in plugins that explicitly support preminted names
        if (pluginSupportsPremintedNames(pluginName)) return;

        // invariant: if the domain does not exist and the plugin does not support preminted names, panic
        throw new Error(
          `Invariant: Registrar#NameRenewed was emitted and a Domain entity does not exist for node ${node}. This indicates that a name was registered in the Registrar but _not_ in the ENS Registry (i.e. 'preminted'). Currently this is only supported on Basenames and Lineanames, but this occurred in plugin '${pluginName}'.`,
        );
      }

      // update Registration expiry
      await context.db.update(schema.registration, { id }).set({ expiryDate: expires });

      // update Domain expiry
      await context.db
        .update(schema.domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // log RegistrationEvent
      await context.db.insert(schema.nameRenewed).values({
        ...sharedEventValues(context.chain.id, event),
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

      // NOTE(subgraph-compat): despite the short-circuits below, upsertAccount must always be run
      await upsertAccount(context, to);

      const node = makeSubdomainNode(labelHash, registrarManagedNode);
      const id = makeRegistrationId(labelHash, node);

      // if the Transfer event occurs before the Registration entity exists (i.e. the initial
      // registration, which is Transfer -> NewOwner -> NameRegistered), no-op
      const registration = await context.db.find(schema.registration, { id });
      if (!registration) return;

      // NOTE(preminted-names): 'preminted' names (names that are regsitered in a Registrar but
      // NOT registered in the ENS Registry) can be transferred, updating the registrant.
      //
      // In the event that the Domain entity does not exist, this must be a preminted name, and
      // we enforce that this codepath can only execute in the context of plugins whose indexed
      // contracts implement 'preminting' names.
      const domain = await context.db.find(schema.domain, { id: node });
      if (!domain) {
        // no-op the Transfer event in plugins that explicitly support preminted names
        if (pluginSupportsPremintedNames(pluginName)) return;

        // invariant: if the domain does not exist and the plugin does not support preminted names, panic
        throw new Error(
          `Invariant: Registrar#Transfer was emitted and a Domain entity does not exist for node ${node}. This indicates that a name was registered in the Registrar but _not_ in the ENS Registry (i.e. 'preminted'). Currently this is only supported on Basenames and Lineanames, but this occurred in plugin '${pluginName}'.`,
        );
      }

      // update registration registrant
      await context.db.update(schema.registration, { id }).set({ registrantId: to });

      // update domain registrant
      await context.db.update(schema.domain, { id: node }).set({ registrantId: to });

      // log RegistrationEvent
      await context.db.insert(schema.nameTransferred).values({
        ...sharedEventValues(context.chain.id, event),
        registrationId: id,
        newOwnerId: to,
      });
    },
  };
};
