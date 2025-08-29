import { ponder } from "ponder:registry";
import { PluginName } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { namespaceContract } from "@/lib/plugin-helpers";
import { NFTTransferEventMetadata } from "@/lib/tokenscope/assets";
import { buildSupportedNFT } from "@/lib/tokenscope/nft-issuers";
import { DatasourceNames } from "@ensnode/datasources";

import { handleNFTTransfer } from "../lib/handle-nft-transfer";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(
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

  ponder.on(
    namespaceContract(pluginName, "BaseBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const nft = buildSupportedNFT(
        config.namespace,
        DatasourceNames.Basenames,
        "BaseRegistrar",
        event.args.id,
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

  ponder.on(
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
