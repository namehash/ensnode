import { Context, ponder } from "ponder:registry";
import { BASENAMES_NODE, ETH_NODE, LINEANAMES_NODE, PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { getDatasourceContract } from "@/lib/datasource-helpers";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import { AssetNamespaces, SupportedNFT, buildSupportedNFTAssetId } from "@/lib/tokenscope/assets";
import { labelHashGeneratedTokenIdToNode } from "@/lib/tokenscope/token-issuers";
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
  const isMint = isAddressEqual(from, zeroAddress);
  const isBurn = isAddressEqual(to, zeroAddress);

  // sanity check, handle theoretical mint to zero address with no-op
  if (isMint && isBurn) return;

  if (isMint) {
    // a transfer from the zero address means `nft` was minted
    await upsertAccount(context, to);

    // insert a record of `nft` as a newly minted token
    await context.db.insert(schema.nameTokens).values({
      id: assetId,
      chainId: nft.contract.chainId,
      contractAddress: nft.contract.address,
      tokenId: nft.tokenId,
      assetNamespace: nft.assetNamespace,
      domainId: nft.domainId,
      owner: to,
    });
  } else if (isBurn) {
    // a transfer to the zero address means `nft` was burned
    // delete the record of the burned `nft`
    await context.db.delete(schema.nameTokens, { id: assetId });
  } else {
    // a transfer from a non-zero address to a non-zero address means `nft` was transferred
    // update the owner of the transferred `nft`
    await context.db.update(schema.nameTokens, { id: assetId }).set({
      owner: to,
    });
  }
};
