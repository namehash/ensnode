import { Context, ponder } from "ponder:registry";
import schema from "ponder:schema";

import {
  PluginName,
  labelHashForReverseAddress,
  makeSubdomainNode,
  maybeHealLabelByReverseAddress,
} from "@ensnode/utils";

import { ENSIndexerPluginHandlerArgs } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { Address, namehash } from "viem";

const REVERSE_ROOT_NODE = namehash("addr.reverse");

export default function ({ namespace }: ENSIndexerPluginHandlerArgs<PluginName.Subgraph>) {
  ponder.on(namespace("ArgentWalletFactory:WalletCreated"), async ({ context, event }) =>
    handleWalletCreated(context, {
      ...event,
      args: {
        createdWalletAddress: event.args._wallet,
      },
    }),
  );

  ponder.on(namespace("ArgentWalletFactory2:WalletCreated"), async ({ context, event }) =>
    handleWalletCreated(context, {
      ...event,
      args: {
        createdWalletAddress: event.args.wallet,
      },
    }),
  );
}

async function handleWalletCreated(
  context: Context,
  event: EventWithArgs<{ createdWalletAddress: Address }>,
) {
  const { createdWalletAddress } = event.args;
  const createdWalletLabelHash = labelHashForReverseAddress(createdWalletAddress);
  const node = makeSubdomainNode(createdWalletLabelHash, REVERSE_ROOT_NODE);

  // Find a related `NewOwner` event entity in database that was handled
  // just before the currently handled `WalletCreated` event.
  // The recorded `NewOwner` event entity was created within the same transaction
  // and with reverse root node as parent domain ID.
  //
  // NOTE: We leverage the fact that `WalletCreated` event is the very last event
  // emitted within the ArgentWalletFactory transaction
  const newOwnerForReverseDomain = await context.db.find(schema.newOwner, {
    domainId: node,
    parentDomainId: REVERSE_ROOT_NODE,
    transactionID: event.transaction.hash,
  });

  // invariant: a related `NewOwner` event entity must exist within the current transaction
  if (!newOwnerForReverseDomain) {
    throw new Error(
      `A related newOwner for "${createdWalletAddress}" reverse address must exist within the "${event.transaction.hash}" transaction`,
    );
  }
  const healedLabel = maybeHealLabelByReverseAddress({
    maybeReverseAddress: createdWalletAddress,
    labelHash: createdWalletLabelHash,
  });

  // invariant: the reverse address must be healed successfully
  if (!healedLabel) {
    throw new Error(
      `Failed to heal label for "${createdWalletAddress}" reverse address which was created by the ArgentWalletFactory contract`,
    );
  }

  const parentDomain = await context.db.find(schema.domain, {
    id: REVERSE_ROOT_NODE,
  });

  // invariant: a domain for reverse root node must exist
  if (!parentDomain || !parentDomain.name) {
    throw new Error(`A domain for "${REVERSE_ROOT_NODE}" reverse root node must exist`);
  }

  const name = `${healedLabel}.${parentDomain.name}`;

  await context.db.update(schema.domain, { id: node }).set({
    name,
    labelName: healedLabel,
  });
}
