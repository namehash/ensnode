import { Context, ponder } from "ponder:registry";
import { BASENAMES_NODE, ETH_NODE, LINEANAMES_NODE, PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { getDatasourceContract } from "@/lib/datasource-helpers";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import {
  AssetNamespaces,
  NFTMintStatuses,
  SupportedNFT,
  buildSupportedNFTAssetId,
} from "@/lib/tokenscope/assets";
import { labelHashGeneratedTokenIdToNode } from "@/lib/tokenscope/nft-issuers";
import { DatasourceNames } from "@ensnode/datasources";
import { Address, isAddressEqual, zeroAddress } from "viem";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(
    namespaceContract(pluginName, "EthBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const contract = getDatasourceContract(
        config.namespace,
        DatasourceNames.ENSRoot,
        "BaseRegistrar",
      );
      const domainId = labelHashGeneratedTokenIdToNode(event.args.tokenId, ETH_NODE);

      const nft: SupportedNFT = {
        contract,
        tokenId: event.args.tokenId,
        assetNamespace: AssetNamespaces.ERC721,
        domainId,
      };

      handleERC721Transfer(context, event.args.from, event.args.to, nft);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const contract = getDatasourceContract(
        config.namespace,
        DatasourceNames.Basenames,
        "BaseRegistrar",
      );
      const domainId = labelHashGeneratedTokenIdToNode(event.args.id, BASENAMES_NODE);
      const nft: SupportedNFT = {
        contract,
        tokenId: event.args.id,
        assetNamespace: AssetNamespaces.ERC721,
        domainId,
      };

      handleERC721Transfer(context, event.args.from, event.args.to, nft);
    },
  );

  ponder.on(
    namespaceContract(pluginName, "LineaBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const contract = getDatasourceContract(
        config.namespace,
        DatasourceNames.Lineanames,
        "BaseRegistrar",
      );
      const domainId = labelHashGeneratedTokenIdToNode(event.args.tokenId, LINEANAMES_NODE);
      const nft: SupportedNFT = {
        contract,
        tokenId: event.args.tokenId,
        assetNamespace: AssetNamespaces.ERC721,
        domainId,
      };

      handleERC721Transfer(context, event.args.from, event.args.to, nft);
    },
  );
}

const handleERC721Transfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
): Promise<void> => {
  const assetId = buildSupportedNFTAssetId(nft);

  // a transfer from the zero address means `nft` was minted
  const isMint = isAddressEqual(from, zeroAddress);

  // a transfer to the zero address means `nft` was burned
  const isBurn = isAddressEqual(to, zeroAddress);

  // get the currently indexed record for the assetId (if it exists)
  const indexedNft = await context.db.find(schema.nameTokens, { id: assetId });

  if (!indexedNft) {
    // this NFT has never been minted (or indexed) before

    if (isMint && isBurn) {
      // sanity check for theoretical mint to zero address
      // state transition from never minted -> minted -> burned is no-op (retain never minted state)
      return;
    } else if (isBurn) {
      // sanity check for burning a NFT we have never indexed before
      throw new Error(`NFT ${assetId} has invalid state transition from never minted -> burned`);
    } else if (!isMint) {
      // sanity check for transferring a NFT we have never indexed before
      throw new Error(
        `NFT ${assetId} has invalid state transition from never minted -> transferred`,
      );
    } else {
      // state transition from never minted -> minted
      // insert a record of the `nft` that has been minted for the first time
      await upsertAccount(context, to);
      await context.db.insert(schema.nameTokens).values({
        id: assetId,
        chainId: nft.contract.chainId,
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        assetNamespace: nft.assetNamespace,
        domainId: nft.domainId,
        owner: to,
        mintStatus: NFTMintStatuses.Minted,
      });
    }
    return;
  }

  // we've previously indexed this NFT

  if (isMint && isBurn) {
    // sanity check for theoretical mint to zero address
    if (indexedNft.mintStatus === NFTMintStatuses.Minted)
      throw new Error(
        `NFT ${assetId} has invalid state transition from minted -> minted -> burned`,
      );

    // state transition from burned -> minted -> burned is no-op
  } else if (isMint) {
    if (indexedNft.mintStatus === NFTMintStatuses.Minted)
      throw new Error(`NFT ${assetId} has invalid state transition from minted -> minted`);

    // state transition from burned -> minted
    // update the mint status and owner of the `nft`
    await upsertAccount(context, to);
    await context.db.update(schema.nameTokens, { id: assetId }).set({
      owner: to,
      mintStatus: NFTMintStatuses.Minted,
    });
  } else if (isBurn) {
    if (indexedNft.mintStatus === NFTMintStatuses.Burned)
      throw new Error(`NFT ${assetId} has invalid state transition from burned -> burned`);

    // state transition from minted -> burned
    // update the mint status and owner of the `nft`
    // TODO: should we remove this upsertAccount call?
    await upsertAccount(context, zeroAddress);
    await context.db.update(schema.nameTokens, { id: assetId }).set({
      owner: zeroAddress,
      mintStatus: NFTMintStatuses.Burned,
    });
  } else {
    if (indexedNft.mintStatus === NFTMintStatuses.Burned)
      throw new Error(`NFT ${assetId} has invalid state transition from burned -> transferred`);

    // a transfer from a non-zero address to a non-zero address means `nft` was transferred

    // state transition from minted -> transferred (still minted)
    // update owner of the `nft`
    await upsertAccount(context, to);
    await context.db.update(schema.nameTokens, { id: assetId }).set({
      owner: to,
    });
  }
};
