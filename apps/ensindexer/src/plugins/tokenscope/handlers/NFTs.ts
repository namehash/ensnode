import { Context, ponder } from "ponder:registry";
import { PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { getDatasourceContract } from "@/lib/datasource-helpers";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  NFTMintStatuses,
  NFTTransferTypes,
  SupportedNFT,
  TokenId,
  buildSupportedNFTAssetId,
  getNFTTransferType,
} from "@/lib/tokenscope/assets";
import { getSupportedNFTIssuer } from "@/lib/tokenscope/nft-issuers";
import { DatasourceName, DatasourceNames, ENSNamespaceId } from "@ensnode/datasources";
import { Address, zeroAddress } from "viem";

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

      handleTransfer(context, event.args.from, event.args.to, nft);
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

      handleTransfer(context, event.args.from, event.args.to, nft);
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

      handleTransfer(context, event.args.from, event.args.to, nft);
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

      // NOTE: we don't make any use of event.args.operator in this handler
      handleERC1155Transfer(context, event.args.from, event.args.to, nft, event.args.value);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "NameWrapper:TransferBatch"),
    async ({ context, event }) => {
      if (event.args.ids.length !== event.args.values.length) {
        throw new Error(
          `ERC1155 transfer batch ids and values must have the same length, got ${event.args.ids.length} and ${event.args.values.length}`,
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
        // NOTE: we don't make any use of event.args.operator in this handler
        handleERC1155Transfer(context, event.args.from, event.args.to, nft, value);
      }
    },
  );
}

const buildSupportedNFT = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
  contractName: string,
  tokenId: TokenId,
): SupportedNFT => {
  const contract = getDatasourceContract(namespaceId, datasourceName, contractName);

  const nftIssuer = getSupportedNFTIssuer(namespaceId, contract);
  if (!nftIssuer) {
    throw new Error(
      `Error getting nftIssuer for contract name ${contractName} at address ${contract.address} on chainId ${contract.chainId} in datasource ${datasourceName} in namespace ${config.namespace}.`,
    );
  }
  const domainId = nftIssuer.getDomainId(tokenId);

  return {
    contract,
    tokenId,
    assetNamespace: nftIssuer.assetNamespace,
    domainId,
  };
};

const handleERC1155Transfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
  value: bigint,
): Promise<void> => {
  // sanity check for ERC1155 transfer single value
  if (value !== 1n) {
    // to be a TokenScope supported ERC1155 NFT issuer, the contract must never
    // have a balance or amount > 1 for any tokenId
    throw new Error(
      `ERC1155 transfer single value must be 1, got ${value} for nft ${buildSupportedNFTAssetId(nft)}`,
    );
  }

  handleTransfer(context, from, to, nft);
};

const handleTransfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
): Promise<void> => {
  const assetId = buildSupportedNFTAssetId(nft);

  // get the currently indexed record for the assetId (if it exists)
  const indexedNft = await context.db.find(schema.ext_nameTokens, { id: assetId });
  const transferType = getNFTTransferType(from, to, nft, indexedNft?.owner);

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
