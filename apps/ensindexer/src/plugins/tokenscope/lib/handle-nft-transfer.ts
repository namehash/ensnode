import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, zeroAddress } from "viem";

import { upsertAccount } from "@/lib/subgraph/db-helpers";
import {
  NFTMintStatuses,
  NFTTransferEventMetadata,
  NFTTransferTypes,
  SupportedNFT,
  buildSupportedNFTAssetId,
  formatNFTTransferEventMetadata,
  getNFTTransferType,
} from "@/lib/tokenscope/assets";

export const handleERC1155Transfer = async (
  context: Context,
  from: Address,
  to: Address,
  allowMintedRemint: boolean,
  nft: SupportedNFT,
  amount: bigint,
  metadata: NFTTransferEventMetadata,
): Promise<void> => {
  // Sanity Check: ERC1155 contract must transfer exactly 1 item
  if (amount !== 1n) {
    throw new Error(
      `Error: ERC1155 transfer single value must be 1, got ${amount}\n${formatNFTTransferEventMetadata(metadata)}`,
    );
  }

  // handle it as a normal nft transfer
  await handleNFTTransfer(context, from, to, allowMintedRemint, nft, metadata);
};

export const handleNFTTransfer = async (
  context: Context,
  from: Address,
  to: Address,
  allowMintedRemint: boolean,
  nft: SupportedNFT,
  metadata: NFTTransferEventMetadata,
): Promise<void> => {
  const assetId = buildSupportedNFTAssetId(nft);

  // get the previously indexed record for the assetId (if it exists)
  const previous = await context.db.find(schema.ext_nameTokens, { id: assetId });
  const transferType = getNFTTransferType(from, to, allowMintedRemint, metadata, previous?.owner);

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

    case NFTTransferTypes.MintBurn:
      // mint status transition from unindexed -> burned
      // insert the record of the nft that has been minted for the first time
      // ... but minted to the zeroAddress and therefore we should initialize
      // it's state as burned
      // TODO: should we remove this upsertAccount call with the zeroAddress?
      await upsertAccount(context, zeroAddress);
      await context.db.insert(schema.ext_nameTokens).values({
        id: assetId,
        chainId: nft.contract.chainId,
        contractAddress: nft.contract.address,
        tokenId: nft.tokenId,
        assetNamespace: nft.assetNamespace,
        domainId: nft.domainId,
        owner: zeroAddress,
        mintStatus: NFTMintStatuses.Burned,
      });
      break;

    case NFTTransferTypes.Remint:
      // mint status transition from burned -> minted
      // update the mint status and owner of the previously indexed nft
      await upsertAccount(context, to);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: to,
        mintStatus: NFTMintStatuses.Minted,
      });
      break;

    case NFTTransferTypes.Burn:
    // the indexed state transition for a minted-remint-burn is the same as a burn
    case NFTTransferTypes.MintedRemintBurn:
      // mint status transition from minted -> burned
      // update the mint status and owner of the previously indexed nft
      // TODO: should we remove this upsertAccount call with the zeroAddress?
      await upsertAccount(context, zeroAddress);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: zeroAddress,
        mintStatus: NFTMintStatuses.Burned,
      });
      break;

    case NFTTransferTypes.Transfer:
    // the indexed state transition for a minted-remint is the same as a transfer
    case NFTTransferTypes.MintedRemint:
      // mint status remains minted (no change)
      // update owner of the previously indexed nft
      await upsertAccount(context, to);
      await context.db.update(schema.ext_nameTokens, { id: assetId }).set({
        owner: to,
      });
      break;

    case NFTTransferTypes.SelfTransfer:
    case NFTTransferTypes.RemintBurn:
      // no indexed state changes needed for previously indexed NFTs upon SelfTransfer or RemintBurn
      break;
  }
};
