/** biome-ignore-all lint/correctness/noUnusedVariables: ignore for now */

import {
  asLiteralLabel,
  type Label,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  makeENSv1DomainId,
  makeSubdomainNode,
} from "enssdk";

import { type EncodedReferrer, PluginName, toJson } from "@ensnode/ensnode-sdk";

import { ensureDomainEvent, ensureEvent } from "@/lib/ensv2/event-db-helpers";
import { ensureLabel, ensureUnknownLabel, labelExists } from "@/lib/ensv2/label-db-helpers";
import { getLatestRegistration, getLatestRenewal } from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
import {
  addOnchainEventListener,
  ensIndexerSchema,
  type IndexingEngineContext,
} from "@/lib/indexing-engines/ponder";
import { logger } from "@/lib/logger";
import { getManagedName } from "@/lib/managed-names";
import { namespaceContract } from "@/lib/plugin-helpers";
import type { EventWithArgs } from "@/lib/ponder-helpers";

const pluginName = PluginName.ENSv2;

/**
 * Returns the input `label` as LiteralLabel iff it matches the provided `labelHash`.
 *
 * NOTE(labelhash-mismatch): If emitted, the label arg should match the emitted labelHash.
 * If the label is not UTF-8, however, ABI decoding substitutes U+FFFD for non-UTF-8 bytes, and
 * the original bytes can't be recovered post-decode. When that happens we treat the label as
 * unknown so the registration still indexes correctly under an unknown label.
 */
const literalLabelIffMatchesLabelHash = (
  label: Label | undefined,
  labelHash: LabelHash,
): LiteralLabel | undefined => {
  if (label === undefined) return undefined;

  const literalLabel = asLiteralLabel(label);
  const matches = labelhashLiteralLabel(literalLabel) === labelHash;
  if (matches) return literalLabel;

  logger.warn({
    msg: `RegistrarController label/labelHash mismatch (non-UTF-8 bytes?): label='${literalLabel}' labelHash='${labelHash}' — treating label as unemitted`,
  });

  return undefined;
};

export default function () {
  async function handleNameRegisteredByController({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{
      label?: Label;
      labelHash: LabelHash;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { labelHash, baseCost: base, premium, referrer } = event.args;
    const label = literalLabelIffMatchesLabelHash(event.args.label, labelHash);

    const controller = getThisAccountId(context, event);
    const { node: managedNode, registry } = getManagedName(controller);

    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(registry, node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRegistered): NameRegistered but no Registration.`,
      );
    }

    // if the contract emitted a (verified) healed label, ensure that it is indexed
    if (label !== undefined) {
      await ensureLabel(context, label);
    } else {
      // otherwise, attempt a heal if not exists
      const exists = await labelExists(context, labelHash);
      if (!exists) await ensureUnknownLabel(context, labelHash);
    }

    // update registration's base/premium
    // TODO(paymentToken): add payment token tracking here
    await context.ensDb
      .update(ensIndexerSchema.registration, { id: registration.id })
      .set({ base, premium, referrer });

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  async function handleNameRenewedByController({
    context,
    event,
  }: {
    context: IndexingEngineContext;
    event: EventWithArgs<{
      label?: Label;
      labelHash: LabelHash;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { labelHash, baseCost: base, premium, referrer } = event.args;
    const label = literalLabelIffMatchesLabelHash(event.args.label, labelHash);

    // if the contract emitted a (verified) healed label, ensure that it is indexed
    if (label !== undefined) {
      await ensureLabel(context, label);
    } else {
      // otherwise, attempt a heal if not exists
      const exists = await labelExists(context, labelHash);
      if (!exists) await ensureUnknownLabel(context, labelHash);
    }

    const controller = getThisAccountId(context, event);
    const { node: managedNode, registry } = getManagedName(controller);
    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(registry, node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRenewed): NameRenewed but no Registration.\n${toJson(
          {
            label,
            labelHash,
            managedNode,
            node,
            domainId,
          },
          { pretty: true },
        )}`,
      );
    }

    const renewal = await getLatestRenewal(context, domainId, registration.registrationIndex);
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
          { pretty: true },
        )}`,
      );
    }

    // update renewal info
    // TODO(paymentToken): add payment token tracking here
    await context.ensDb
      .update(ensIndexerSchema.renewal, { id: renewal.id })
      .set({ base, premium, referrer });

    // push event to domain history
    const eventId = await ensureEvent(context, event);
    await ensureDomainEvent(context, domainId, eventId);
  }

  //////////////////////////////////////
  // RegistrarController:NameRegistered
  //////////////////////////////////////
  addOnchainEventListener(
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
  addOnchainEventListener(
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
  addOnchainEventListener(
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
  addOnchainEventListener(
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
  addOnchainEventListener(
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
  addOnchainEventListener(
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
            // `name` param is misnamed onchain — re-map to proper ENS terminology
            label: event.args.name,
            // `label` param is misnamed onchain — re-map to proper ENS terminology
            labelHash: event.args.label,
            baseCost: event.args.cost,
          },
        },
      }),
  );
  addOnchainEventListener(
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
            // `name` param is misnamed onchain — re-map to proper ENS terminology
            label: event.args.name,
            // `label` param is misnamed onchain — re-map to proper ENS terminology
            labelHash: event.args.label,
          },
        },
      }),
  );
}
