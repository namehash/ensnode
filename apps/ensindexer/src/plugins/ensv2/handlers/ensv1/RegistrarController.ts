/** biome-ignore-all lint/correctness/noUnusedVariables: ignore for now */
import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";

import {
  type EncodedReferrer,
  type Label,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  makeENSv1DomainId,
  makeSubdomainNode,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureLabel, ensureUnknownLabel } from "@/lib/ensv2/label-db-helpers";
import { getLatestRegistration, getLatestRenewal } from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import { toJson } from "@/lib/json-stringify-with-bigints";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

export default function () {
  async function handleNameRegisteredByController({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      label?: Label;
      labelHash: LabelHash;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { label: _label, labelHash, baseCost: base, premium, referrer } = event.args;
    const label = _label as LiteralLabel | undefined;

    // Invariant: If emitted, label must align with labelHash
    if (label !== undefined && labelHash !== labelhashLiteralLabel(label)) {
      throw new Error(
        `Invariant(RegistrarController:NameRegistered): Emitted label '${label}' does not labelhash to emitted labelHash '${labelHash}'.`,
      );
    }

    const controller = getThisAccountId(context, event);
    const { node: managedNode } = getManagedName(controller);

    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRegistered): NameRegistered but no Registration.`,
      );
    }

    // ensure label
    if (label !== undefined) {
      await ensureLabel(context, label);
    } else {
      await ensureUnknownLabel(context, labelHash);
    }

    // update registration's base/premium
    // TODO(paymentToken): add payment token tracking here
    await context.db
      .update(schema.registration, { id: registration.id })
      .set({ base, premium, referrer });
  }

  async function handleNameRenewedByController({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      label?: string;
      labelHash: LabelHash;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { label: _label, labelHash, baseCost: base, premium, referrer } = event.args;
    const label = _label as LiteralLabel;

    // Invariant: If emitted, label must align with labelHash
    if (label !== undefined && labelHash !== labelhashLiteralLabel(label)) {
      throw new Error(
        `Invariant(RegistrarController:NameRegistered): Emitted label '${label}' does not labelhash to emitted labelHash '${labelHash}'.`,
      );
    }

    const controller = getThisAccountId(context, event);
    const { node: managedNode } = getManagedName(controller);
    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRenewed): NameRenewed but no Registration.\n${toJson({
          label,
          labelHash,
          managedNode,
          node,
          domainId,
        })}`,
      );
    }

    const renewal = await getLatestRenewal(context, domainId, registration.index);
    if (!renewal) {
      throw new Error(
        `Invariant(RegistrarController:NameRenewed): NameRenewed but no Renewal for Registration\n${toJson(
          {
            label,
            labelHash,
            managedNode,
            node,
            domainId,
            registration,
          },
        )}`,
      );
    }

    // ensure label
    // NOTE: technically not necessary, as should be ensured by NameRegistered, but we include here anyway
    if (label !== undefined) {
      await ensureLabel(context, label);
    } else {
      await ensureUnknownLabel(context, labelHash);
    }

    // update renewal info
    // TODO(paymentToken): add payment token tracking here
    await context.db.update(schema.renewal, { id: renewal.id }).set({ base, premium, referrer });
  }

  //////////////////////////////////////
  // RegistrarController:NameRegistered
  //////////////////////////////////////
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string label, bytes32 indexed labelhash, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires, bytes32 referrer)",
    ),
    ({ context, event }) =>
      handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: event.args.labelhash },
        },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires)",
    ),
    ({ context, event }) =>
      handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: { ...event.args, label: event.args.name, labelHash: event.args.label },
        },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 cost, uint256 expires)",
    ),
    ({ context, event }) =>
      handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: { ...event.args, label: event.args.name, labelHash: event.args.label },
        },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 expires)",
    ),
    ({ context, event }) =>
      handleNameRegisteredByController({
        context,
        event: {
          ...event,
          args: { ...event.args, label: event.args.name, labelHash: event.args.label },
        },
      }),
  );

  ///////////////////////////////////
  // RegistrarController:NameRenewed
  ///////////////////////////////////
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRenewed(string label, bytes32 indexed labelhash, uint256 cost, uint256 expires, bytes32 referrer)",
    ),
    ({ context, event }) =>
      handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: { ...event.args, labelHash: event.args.labelhash, baseCost: event.args.cost },
        },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRenewed(string name, bytes32 indexed label, uint256 cost, uint256 expires)",
    ),
    ({ context, event }) =>
      handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            // name is actually label
            label: event.args.name,
            // label is actually labelHash
            labelHash: event.args.label,
            baseCost: event.args.cost,
          },
        },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRenewed(string name, bytes32 indexed label, uint256 expires)",
    ),
    ({ context, event }) =>
      handleNameRenewedByController({
        context,
        event: {
          ...event,
          args: {
            // name is actually label
            label: event.args.name,
            // label is actually labelHash
            labelHash: event.args.label,
          },
        },
      }),
  );
}
