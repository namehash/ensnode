import config from "@/config";

import { ponder } from "ponder:registry";

import { DatasourceNames } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

import { namespaceContract } from "@/lib/plugin-helpers";
import type { NFTTransferEventMetadata } from "@/lib/tokenscope/assets";
import { buildSupportedNFT } from "@/lib/tokenscope/nft-issuers";

import { handleERC1155Transfer } from "../lib/handle-nft-transfer";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:TransferSingle"),
    async ({ context, event }) => {
      const nft = buildSupportedNFT(
        config.namespace,
        DatasourceNames.ENSRoot,
        "NameWrapper",
        event.args.id,
      );

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "NameWrapper:TransferSingle",
        nft,
      };

      // NOTE: we don't make any use of event.args.operator in this handler
      await handleERC1155Transfer(
        context,
        event.args.from,
        event.args.to,
        false,
        nft,
        event.args.value,
        metadata,
      );
    },
  );

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:TransferBatch"),
    async ({ context, event }) => {
      if (event.args.ids.length !== event.args.values.length) {
        throw new Error(
          `Error: ERC1155 transfer batch ids and values must have the same length, got ${event.args.ids.length} and ${event.args.values.length}.`,
        );
      }

      for (let i = 0; i < event.args.ids.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: we know that ids and values have length > i
        const tokenId = event.args.ids[i]!;
        // biome-ignore lint/style/noNonNullAssertion: we know that ids and values have length > i
        const value = event.args.values[i]!;

        const nft = buildSupportedNFT(
          config.namespace,
          DatasourceNames.ENSRoot,
          "NameWrapper",
          tokenId,
        );

        const metadata: NFTTransferEventMetadata = {
          chainId: context.chain.id,
          blockNumber: event.block.number,
          transactionHash: event.transaction.hash,
          eventHandlerName: "NameWrapper:TransferBatch",
          nft,
        };

        // NOTE: we don't make any use of event.args.operator in this handler
        await handleERC1155Transfer(
          context,
          event.args.from,
          event.args.to,
          false,
          nft,
          value,
          metadata,
        );
      }
    },
  );
}
