import { type Context } from "ponder:registry";
import schema from "ponder:schema";
import { type Address, namehash } from "viem";

import {
  InterpretedLabel,
  InterpretedName,
  type Label,
  type LabelHash,
  LiteralLabel,
  PluginName,
  SubgraphInterpretedLabel,
  SubgraphInterpretedName,
  encodeLabelHash,
  literalLabelToInterpretedLabel,
  makeSubdomainNode,
} from "@ensnode/ensnode-sdk";

import config from "@/config";
import { labelByLabelHash } from "@/lib/graphnode-helpers";
import { pluginSupportsPremintedNames } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";
import { sharedEventValues, upsertAccount, upsertRegistration } from "@/lib/subgraph/db-helpers";
import { makeRegistrationId } from "@/lib/subgraph/ids";
import { isLabelSubgraphIndexable } from "@/lib/subgraph/is-label-subgraph-indexable";
import type { RegistrarManagedName } from "@/lib/types";
import { handleNewOwner } from "@/plugins/subgraph/shared-handlers/Registry";

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
    label: LiteralLabel,
    labelHash: LabelHash,
    cost: bigint,
  ) {
    // NOTE(subgraph-compat): if the label is not subgraph-indexable, ignore it entirely
    if (config.isSubgraphCompatible && !isLabelSubgraphIndexable(label)) return;

    const interpretedLabel = config.isSubgraphCompatible
      ? // A subgraph-indexable Literal Label is a Subgraph Interpreted Label
        (label as Label as SubgraphInterpretedLabel)
      : // NOTE(replace-unnormalized): Interpret the `label` Literal Label into an Interpreted Label
        // see https://ensnode.io/docs/reference/terminology#literal-label
        // see https://ensnode.io/docs/reference/terminology#interpreted-label
        literalLabelToInterpretedLabel(label);

    const node = makeSubdomainNode(labelHash, registrarManagedNode);
    const domain = await context.db.find(schema.subgraph_domain, { id: node });

    // encode the runtime assertion here https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L101
    if (!domain) throw new Error("domain expected in setNamePreimage but not found");

    // materialize the domain's name and labelName using the emitted values
    if (domain.labelName !== interpretedLabel) {
      // in either case a Name composed of (Subgraph) Interpreted Labels is (Subgraph) Interpreted
      const interpretedName = `${interpretedLabel}.${registrarManagedName}` as
        | InterpretedName
        | SubgraphInterpretedName;

      await context.db
        .update(schema.subgraph_domain, { id: node })
        .set({ labelName: interpretedLabel, name: interpretedName });
    }

    // update the registration's labelName
    await context.db
      .update(schema.subgraph_registration, { id: makeRegistrationId(labelHash, node) })
      .set({ labelName: interpretedLabel, cost });
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
      // Preminted names are not 'real' ENS names — they do not exist in the Registry. This violates
      // an implicit assumption in the Subgraph's datamodel, which is that every Registration has an
      // associated Domain (and vise-versa). As a workaround, if the domain does not yet exist
      // (and the Registrar in question supports preminted names), we create the Domain entity anyway.
      //
      // Therefore, if a Domain does not exist in Registrar#NameRegistered, it _must_ be a 'preminted'
      // name, tracked only in the Registrar. If/when these 'preminted' names are _actually_ registered
      // in the future, they will emit NewOwner as expected.
      const domain = await context.db.find(schema.subgraph_domain, { id: node });
      if (!domain) {
        // invariant: if the domain does not exist and the plugin does not support preminted names, panic
        if (!pluginSupportsPremintedNames(pluginName)) {
          throw new Error(
            `Invariant: Registrar#NameRegistered was emitted before Registry#NewOwner and a Domain entity does not exist for node ${node}. This indicates that a name was registered in the Registrar but _not_ in the ENS Registry (i.e. 'preminted'). Currently this is only supported on Basenames and Lineanames, but this occurred in plugin '${pluginName}'.`,
          );
        }

        // NOTE(preminted-names): this is a bit cursed, but we just execute the shared Registry#NewOwner
        // handler in order to create the preminted Domain entities. This helps us DRY the
        // Registry#NewOwner-related code that is expected to have been run by this point.
        // Note as well that isMigrated: true is acceptable because the plugins that support preminted
        // names (Basenames, Lineanames) only managed Domains that are considered 'migrated' within
        // the Subgraph datamodel.
        await handleNewOwner(true)({
          context,
          event: {
            ...event,
            args: {
              owner,
              node: registrarManagedNode,
              label: labelHash,
            },
          },
        });
      }

      // attempt to heal the label via ENSRainbow
      // https://github.com/ensdomains/ens-subgraph/blob/c68a889/src/ethRegistrar.ts#L56-L61
      const healedLabel = await labelByLabelHash(labelHash);

      let label: InterpretedLabel | SubgraphInterpretedLabel | undefined = undefined;
      let name: InterpretedName | SubgraphInterpretedName | undefined = undefined;
      if (config.isSubgraphCompatible) {
        // only update the label/name if label is subgraph-indexable
        if (isLabelSubgraphIndexable(healedLabel)) {
          // if subgraph-indexable, the label is Subgraph Interpreted
          label = healedLabel as Label as SubgraphInterpretedLabel;
          // a name constructed of Subgraph Interpreted Labels is Subgraph Interpreted
          name = `${label}.${registrarManagedName}` as SubgraphInterpretedName;
        }
      } else {
        // Interpret the `healedLabel` Literal Label into an Interpreted Label
        // see https://ensnode.io/docs/reference/terminology#literal-label
        // see https://ensnode.io/docs/reference/terminology#interpreted-label
        label = (
          healedLabel !== null
            ? literalLabelToInterpretedLabel(healedLabel)
            : encodeLabelHash(labelHash)
        ) as InterpretedLabel;

        // a name constructed of Interpreted Labels is Interpreted
        name = `${label}.${registrarManagedName}` as InterpretedName;
      }

      // update Domain
      await context.db.update(schema.subgraph_domain, { id: node }).set({
        registrantId: owner,
        expiryDate: expires + GRACE_PERIOD_SECONDS,
        labelName: label,
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
        labelName: label,
      });

      // log RegistrationEvent
      await context.db.insert(schema.subgraph_nameRegistered).values({
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
      const { label, labelHash, cost } = event.args;

      await setNamePreimage(
        context,
        label as LiteralLabel, // NameRegistered emits Literal Labels
        labelHash,
        cost,
      );
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
      const { label, labelHash, cost } = event.args;

      await setNamePreimage(
        context,
        label as LiteralLabel, // NameRenewed emits Literal Labels
        labelHash,
        cost,
      );
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

      // update Registration expiry
      await context.db.update(schema.subgraph_registration, { id }).set({ expiryDate: expires });

      // update Domain expiry
      await context.db
        .update(schema.subgraph_domain, { id: node })
        .set({ expiryDate: expires + GRACE_PERIOD_SECONDS });

      // log RegistrationEvent
      await context.db.insert(schema.subgraph_nameRenewed).values({
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
      const registration = await context.db.find(schema.subgraph_registration, { id });
      if (!registration) return;

      // update registration registrant
      await context.db.update(schema.subgraph_registration, { id }).set({ registrantId: to });

      // update domain registrant
      await context.db.update(schema.subgraph_domain, { id: node }).set({ registrantId: to });

      // log RegistrationEvent
      await context.db.insert(schema.subgraph_nameTransferred).values({
        ...sharedEventValues(context.chain.id, event),
        registrationId: id,
        newOwnerId: to,
      });
    },
  };
};
