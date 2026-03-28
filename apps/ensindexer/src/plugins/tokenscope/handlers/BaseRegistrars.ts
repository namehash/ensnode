import config from "@/config";

import { DatasourceNames } from "@ensnode/datasources";
import { type NFTTransferEventMetadata, PluginName } from "@ensnode/ensnode-sdk";

import { addOnchainEventListener } from "@/lib/indexing-engines/ponder";
import { namespaceContract } from "@/lib/plugin-helpers";
import { buildSupportedNFT } from "@/lib/tokenscope/nft-issuers";

import { handleNFTTransfer } from "../lib/handle-nft-transfer";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  addOnchainEventListener(
    namespaceContract(pluginName, "EthBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const nft = buildSupportedNFT(
        config.namespace,
        DatasourceNames.ENSRoot,
        "BaseRegistrar",
        event.args.tokenId,
      );

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "EthBaseRegistrar:Transfer",
        nft,
      };

      await handleNFTTransfer(context, event.args.from, event.args.to, false, nft, metadata);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "BaseBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const nft = buildSupportedNFT(
        config.namespace,
        DatasourceNames.Basenames,
        "BaseRegistrar",
        event.args.tokenId,
      );

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "BaseBaseRegistrar:Transfer",
        nft,
      };

      await handleNFTTransfer(context, event.args.from, event.args.to, false, nft, metadata);
    },
  );

  addOnchainEventListener(
    namespaceContract(pluginName, "LineaBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const nft = buildSupportedNFT(
        config.namespace,
        DatasourceNames.Lineanames,
        "BaseRegistrar",
        event.args.tokenId,
      );

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "LineaBaseRegistrar:Transfer",
        nft,
      };

      await handleNFTTransfer(context, event.args.from, event.args.to, false, nft, metadata);
    },
  );
}
