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

  const reverseDomain = await context.db.find(schema.domain, {
    id: node,
  });

  if (!reverseDomain) {
    console.log("Unknown ArgentWalletFactory:WalletCreated", {
      domainId: node,
      transactionID: event.transaction.hash,
      wallet: createdWalletAddress,
    });

    return;
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
