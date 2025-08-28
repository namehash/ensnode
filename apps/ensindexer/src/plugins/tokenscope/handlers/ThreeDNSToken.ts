import { ponder } from "ponder:registry";
import { ChainId, PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { namespaceContract } from "@/lib/plugin-helpers";
import { getThreeDNSTokenId } from "@/lib/threedns-helpers";
import {
  NFTTransferEventMetadata,
  buildSupportedNFTAssetId,
  formatNFTTransferEventMetadata,
} from "@/lib/tokenscope/assets";
import { buildSupportedNFT } from "@/lib/tokenscope/nft-issuers";
import { handleNFTTransfer } from "@/plugins/tokenscope/lib/handle-nft-transfer";
import { DatasourceName, DatasourceNames } from "@ensnode/datasources";
import { zeroAddress } from "viem";
import { base, optimism } from "viem/chains";

const getThreeDNSDatasourceName = (chainId: ChainId): DatasourceName => {
  switch (chainId) {
    case base.id:
      return DatasourceNames.ThreeDNSBase;
    case optimism.id:
      return DatasourceNames.ThreeDNSOptimism;
    default:
      throw new Error(`No ThreeDNS DatasourceName for chain id ${chainId}.`);
  }
};

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationCreated"),
    async ({ context, event }) => {
      // currently no use for tld, fqdn, controlBitmap, or expiry fields in event.args
      const { node, registrant } = event.args;

      const datasourceName = getThreeDNSDatasourceName(context.chain.id);
      const tokenId = getThreeDNSTokenId(node);

      const nft = buildSupportedNFT(config.namespace, datasourceName, "ThreeDNSToken", tokenId);

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "ThreeDNSToken:RegistrationCreated",
        nft,
      };

      await handleNFTTransfer(context, zeroAddress, registrant, nft, metadata);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationTransferred"),
    async ({ context, event }) => {
      // currently no use for operator field in event.args
      const { node, newOwner } = event.args;

      const datasourceName = getThreeDNSDatasourceName(context.chain.id);
      const tokenId = getThreeDNSTokenId(node);

      const nft = buildSupportedNFT(config.namespace, datasourceName, "ThreeDNSToken", tokenId);

      // unfortunately 3DNS doesn't emit the former oldOwner in the event.args, so we need
      // to look it up in the database. this query is then repeated in handleTransfer which
      // is a bit of a bummer but better to keep our logic simple.
      const assetId = buildSupportedNFTAssetId(nft);
      const indexedNft = await context.db.find(schema.ext_nameTokens, { id: assetId });

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "ThreeDNSToken:RegistrationTransferred",
        nft,
      };

      if (!indexedNft) {
        throw new Error(
          `${formatNFTTransferEventMetadata(metadata)} Error: No previously indexed record found for asset.`,
        );
      }

      await handleNFTTransfer(context, indexedNft.owner, newOwner, nft, metadata);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "ThreeDNSToken:RegistrationBurned"),
    async ({ context, event }) => {
      // currently no use for burner field in event.args
      const { node } = event.args;

      const datasourceName = getThreeDNSDatasourceName(context.chain.id);
      const tokenId = getThreeDNSTokenId(node);

      const nft = buildSupportedNFT(config.namespace, datasourceName, "ThreeDNSToken", tokenId);

      // unfortunately 3DNS doesn't emit the former oldOwner in the event.args, so we need
      // to look it up in the database. this query is then repeated in handleTransfer which
      // is a bit of a bummer but better to keep our logic simple.
      const assetId = buildSupportedNFTAssetId(nft);
      const indexedNft = await context.db.find(schema.ext_nameTokens, { id: assetId });

      const metadata: NFTTransferEventMetadata = {
        chainId: context.chain.id,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
        eventHandlerName: "ThreeDNSToken:RegistrationBurned",
        nft,
      };

      if (!indexedNft) {
        throw new Error(
          `${formatNFTTransferEventMetadata(metadata)} Error: No previously indexed record found for asset.`,
        );
      }

      await handleNFTTransfer(context, indexedNft.owner, zeroAddress, nft, metadata);
    },
  );
}
