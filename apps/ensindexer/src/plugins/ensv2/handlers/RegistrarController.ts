import { type Context, ponder } from "ponder:registry";
import schema from "ponder:schema";
import { labelhash, namehash } from "viem";

import {
  type EncodedReferrer,
  type LiteralLabel,
  labelhashLiteralLabel,
  makeENSv1DomainId,
  makeSubdomainNode,
  PluginName,
} from "@ensnode/ensnode-sdk";

import { ensureLabel } from "@/lib/ensv2/label-db-helpers";
import { getRegistrarManagedName } from "@/lib/ensv2/registrar-lib";
import { getLatestRegistration } from "@/lib/ensv2/registration-db-helpers";
import { getThisAccountId } from "@/lib/get-this-account-id";
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
      label: string;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { label: _label, baseCost, premium, referrer } = event.args;
    const label = _label as LiteralLabel;

    const controller = getThisAccountId(context, event);
    const managedNode = namehash(getRegistrarManagedName(controller));
    const labelHash = labelhashLiteralLabel(label);

    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRegistered): NameRegistered but no Registration.`,
      );
    }

    // ensure label
    await ensureLabel(context, label);

    // update registration's baseCost/premium
    await context.db
      .update(schema.registration, { id: registration.id })
      .set({ baseCost, premium, referrer });
  }

  async function handleNameRenewedByController({
    context,
    event,
  }: {
    context: Context;
    event: EventWithArgs<{
      label: string;
      baseCost?: bigint;
      premium?: bigint;
      referrer?: EncodedReferrer;
    }>;
  }) {
    const { label: _label, baseCost, premium, referrer } = event.args;
    const label = _label as LiteralLabel;

    const controller = getThisAccountId(context, event);
    const managedNode = namehash(getRegistrarManagedName(controller));
    const labelHash = labelhash(label);
    const node = makeSubdomainNode(labelHash, managedNode);
    const domainId = makeENSv1DomainId(node);
    const registration = await getLatestRegistration(context, domainId);

    if (!registration) {
      throw new Error(
        `Invariant(RegistrarController:NameRenewed): NameRegistered but no Registration.`,
      );
    }

    // TODO: update renewal with base/premium
    // const renewal = await getLatestRenewal(context, registration.id);
    // if (!renewal) invariant
    // await context.db.update(schema.renewal, { id: renewal.id }).set({ baseCost, premium, referrer })
  }

  //////////////////////////////////////
  // RegistrarController:NameRegistered
  //////////////////////////////////////
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string label, bytes32 indexed labelhash, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires, bytes32 referrer)",
    ),
    handleNameRegisteredByController,
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 baseCost, uint256 premium, uint256 expires)",
    ),
    handleNameRegisteredByController,
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 cost, uint256 expires)",
    ),
    handleNameRegisteredByController,
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRegistered(string name, bytes32 indexed label, address indexed owner, uint256 expires)",
    ),
    handleNameRegisteredByController,
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
        event: { ...event, args: { ...event.args, baseCost: event.args.cost } },
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
        event: { ...event, args: { ...event.args, baseCost: event.args.cost } },
      }),
  );
  ponder.on(
    namespaceContract(
      pluginName,
      "RegistrarController:NameRenewed(string name, bytes32 indexed label, uint256 expires)",
    ),
    handleNameRenewedByController,
  );
}
