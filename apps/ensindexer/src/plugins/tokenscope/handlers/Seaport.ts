import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { PluginName } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { upsertAccount } from "@/lib/db-helpers";
import { makeEventId } from "@/lib/ids";
import { namespaceContract } from "@/lib/plugin-helpers";
import { buildSupportedNFTAssetId } from "@/lib/tokenscope/assets";
import { getSupportedSaleFromOrderFulfilledEvent } from "@/lib/tokenscope/seaport";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(namespaceContract(pluginName, "Seaport:OrderFulfilled"), async ({ context, event }) => {
    const sale = getSupportedSaleFromOrderFulfilledEvent(config.namespace, context.chain.id, event);

    // the Seaport sale in the event is not supported by TokenScope, no-op
    // this can happen for a number of reasons, including:
    // - the sale was for a NFT that is not recognized as being associated with an ENS name
    //   (note how this event is triggered for any sale made through Seaport, not just ENS names)
    // - the sale was not paid for with a supported currency (e.g. ETH, USDC, etc)
    // - the sale received payments in multiple currencies
    // - the sale was for multiple NFTs (not just one)
    // TokenScope purposefully does not support these cases as we believe they overall add
    // more complexity than benefit. We believe it's better to prioritize better simplicity of
    // building apps on TokenScope than supporting these more complex and uncommon cases.
    if (!sale) return;

    // upsert buyer and seller accounts
    await upsertAccount(context, sale.seller);
    await upsertAccount(context, sale.buyer);

    // insert NameSale entity
    await context.db.insert(schema.ext_nameSales).values({
      id: makeEventId(context.chain.id, event.block.number, event.log.logIndex),
      chainId: sale.nft.contract.chainId,
      blockNumber: event.block.number,
      logIndex: event.log.logIndex,
      transactionHash: event.transaction.hash,
      orderHash: sale.orderHash,
      contractAddress: sale.nft.contract.address,
      tokenId: sale.nft.tokenId,
      assetNamespace: sale.nft.assetNamespace,
      assetId: buildSupportedNFTAssetId(sale.nft),
      domainId: sale.nft.domainId,
      buyer: sale.buyer,
      seller: sale.seller,
      currency: sale.payment.price.currency,
      amount: sale.payment.price.amount,
      timestamp: event.block.timestamp,
    });
  });
}
