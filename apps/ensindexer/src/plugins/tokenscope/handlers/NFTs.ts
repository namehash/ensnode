import { Context, ponder } from "ponder:registry";
import { ChainId, Node, PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  NFTMintStatuses,
  NFTTransferEventMetadata,
  NFTTransferTypes,
  SupportedNFT,
  TokenId,
  buildSupportedNFTAssetId,
  formatNFTTransferEventMetadata,
  getNFTTransferType,
} from "@/lib/tokenscope/assets";
import { buildSupportedNFT } from "@/lib/tokenscope/nft-issuers";
import { DatasourceName, DatasourceNames } from "@ensnode/datasources";
import { Address, hexToBigInt, zeroAddress } from "viem";
import { base, optimism } from "viem/chains";

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

      handleTransfer(context, event.args.from, event.args.to, nft, metadata);
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

      handleTransfer(context, event.args.from, event.args.to, nft, metadata);
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

      handleTransfer(context, event.args.from, event.args.to, nft, metadata);
    },
  );

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
      handleERC1155Transfer(
        context,
        event.args.from,
        event.args.to,
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
        // construct a dummy nft just for the purpose building our error message
        const nft = buildSupportedNFT(
          config.namespace,
          DatasourceNames.ENSRoot,
          "NameWrapper",
          0n, // dummy tokenId
        );

        const metadata: NFTTransferEventMetadata = {
          chainId: context.chain.id,
          blockNumber: event.block.number,
          transactionHash: event.transaction.hash,
          eventHandlerName: "NameWrapper:TransferBatch",
          nft,
        };

        throw new Error(
          `${formatNFTTransferEventMetadata(metadata)} Error: ERC1155 transfer batch ids and values must have the same length, got ${event.args.ids.length} and ${event.args.values.length}.`,
        );
      }

      // we know that ids and values have equal length
      const batchSize = event.args.ids.length;

      for (let i = 0; i < batchSize; i++) {
        // using ! as we know that ids and values have length > i
        const tokenId = event.args.ids[i]!;
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
        handleERC1155Transfer(context, event.args.from, event.args.to, nft, value, metadata);
      }
    },
  );

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

      handleTransfer(context, zeroAddress, registrant, nft, metadata);
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

      handleTransfer(context, indexedNft.owner, newOwner, nft, metadata);
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

      handleTransfer(context, indexedNft.owner, zeroAddress, nft, metadata);
    },
  );
}

const getThreeDNSTokenId = (node: Node): TokenId => {
  return hexToBigInt(node, { size: 32 });
};

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

const handleERC1155Transfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
  value: bigint,
  metadata: NFTTransferEventMetadata,
): Promise<void> => {
  // sanity check for ERC1155 transfer single value
  if (value !== 1n) {
    // to be a TokenScope supported ERC1155 NFT issuer, the contract must never
    // have a balance or amount > 1 for any tokenId
    throw new Error(
      `${formatNFTTransferEventMetadata(metadata)} Error: ERC1155 transfer single value must be 1, got ${value}`,
    );
  }

  handleTransfer(context, from, to, nft, metadata);
};

const handleTransfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
  metadata: NFTTransferEventMetadata,
): Promise<void> => {
  const assetId = buildSupportedNFTAssetId(nft);

  // get the currently indexed record for the assetId (if it exists)
  const indexedNft = await context.db.find(schema.ext_nameTokens, { id: assetId });
  const transferType = getNFTTransferType(from, to, metadata, indexedNft?.owner);

  switch (transferType) {
    case NFTTransferTypes.Mint:
      // mint status transition from unindexed -> minted
      // insert the record of the nft that has been minted for the first time
      await upsertAccount(context, to);
      await context.db.insert(schema.ext_nameTokens).values({
        id: assetId,
        chainId: nft.contract.chainId,
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        assetNamespace: nft.assetNamespace,
        domainId: nft.domainId,
        owner: to,
        mintStatus: NFTMintStatuses.Minted,
      });
      break;

    case NFTTransferTypes.Remint:
      // mint status transition from burned -> minted
      // update the mint status and owner of the nft
      await upsertAccount(context, to);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: to,
        mintStatus: NFTMintStatuses.Minted,
      });
      break;

    case NFTTransferTypes.Burn:
      // mint status transition from minted -> burned
      // update the mint status and owner of the nft
      // TODO: should we remove this upsertAccount call with the zeroAddress?
      await upsertAccount(context, zeroAddress);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: zeroAddress,
        mintStatus: NFTMintStatuses.Burned,
      });
      break;

    case NFTTransferTypes.Transfer:
      // mint status remains minted (no change)
      // update owner of the nft
      await upsertAccount(context, to);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: to,
      });
      break;

    case NFTTransferTypes.SelfTransfer:
    case NFTTransferTypes.MintBurn:
    case NFTTransferTypes.NoOp:
      // no indexed state changes needed for SelfTransfer, MintBurn, or NoOp
      break;
  }
};
