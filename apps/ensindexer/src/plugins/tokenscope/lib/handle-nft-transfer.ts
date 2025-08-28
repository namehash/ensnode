import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, zeroAddress } from "viem";

import { upsertAccount } from "@/lib/db-helpers";
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

  // if that's the case
  await handleNFTTransfer(context, from, to, nft, metadata);
};

export const handleNFTTransfer = async (
  context: Context,
  from: Address,
  to: Address,
  nft: SupportedNFT,
  metadata: NFTTransferEventMetadata,
): Promise<void> => {
  const assetId = buildSupportedNFTAssetId(nft);

  // get the currently indexed record for the assetId (if it exists)
  const previous = await context.db.find(schema.ext_nameTokens, { id: assetId });
  const transferType = getNFTTransferType(from, to, metadata, previous?.owner);

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
    case NFTTransferTypes.RemintBurn:
    case NFTTransferTypes.MintBurn:
      // no indexed state changes needed for SelfTransfer, RemintBurn, or MintBurn
      break;
  }
};
