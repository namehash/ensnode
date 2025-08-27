import { Context, ponder } from "ponder:registry";
import { BASENAMES_NODE, ETH_NODE, LINEANAMES_NODE, PluginName } from "@ensnode/ensnode-sdk";

import schema from "ponder:schema";
import config from "@/config";
import { getDatasourceContract } from "@/lib/datasource-helpers";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import { EventWithArgs } from "@/lib/ponder-helpers";
import { AssetNamespaces, SupportedNFT, TokenId, buildNftAssetId } from "@/lib/tokenscope/assets";
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

      return handleERC721Transfer({ context, event, nft });
    },
  );

  ponder.on(
    namespaceContract(pluginName, "BaseBaseRegistrar:Transfer"),
    async ({ context, event }) => {
      const tokenId = event.args.id;

      // rename id field to tokenId to match standard event args for ERC721 transfers
      const eventWithStandardizedArgs = {
        ...event,
        args: {
          to: event.args.to,
          from: event.args.from,
          tokenId,
        },
      };

      const contract = getDatasourceContract(
        config.namespace,
        DatasourceNames.Basenames,
        "BaseRegistrar",
      );
      const domainId = labelHashGeneratedTokenIdToNode(tokenId, BASENAMES_NODE);
      const nft: SupportedNFT = {
        contract,
        tokenId,
        assetNamespace: AssetNamespaces.ERC721,
        domainId,
      };

      return handleERC721Transfer({ context, event: eventWithStandardizedArgs, nft });
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

      return handleERC721Transfer({ context, event, nft });
    },
  );
}

const handleERC721Transfer = async ({
  context,
  event,
  nft,
}: {
  context: Context;
  event: EventWithArgs<{ from: Address; to: Address; tokenId: TokenId }>;
  nft: SupportedNFT;
}) => {
  const { from, to, tokenId } = event.args;

  // invariant sanity check: tokenId values must match
  if (tokenId !== nft.tokenId) {
    throw new Error(`Token ID mismatch in handleERC721Transfer: ${tokenId} !== ${nft.tokenId}`);
  }

  const assetId = buildNftAssetId(nft);

  if (isAddressEqual(from, zeroAddress)) {
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
  } else if (isAddressEqual(to, zeroAddress)) {
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
