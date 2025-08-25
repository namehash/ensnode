import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { PluginName } from "@ensnode/ensnode-sdk";

import config from "@/config";
import { upsertAccount } from "@/lib/db-helpers";
import { namespaceContract } from "@/lib/plugin-helpers";
import { getSupportedSaleFromOrderFulfilledEvent } from "@/lib/tokenscope/seaport";
import { makeTokenRef } from "@/lib/tokenscope/tokens";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(namespaceContract(pluginName, "Seaport:OrderFulfilled"), async ({ context, event }) => {
    const sale = getSupportedSaleFromOrderFulfilledEvent(config.namespace, context.chain.id, event);

    // no supported sale detected in event, no-op
    if (!sale) return;

    // upsert buyer and seller accounts
    await upsertAccount(context, sale.seller);
    await upsertAccount(context, sale.buyer);

    // insert NameSale entity
    await context.db.insert(schema.nameSales).values({
      id: sale.event.eventId,
      chainId: sale.nft.contract.chainId,
      blockNumber: sale.event.blockNumber,
      logIndex: sale.event.logIndex,
      transactionHash: sale.event.transactionHash,
      orderHash: sale.orderHash,
      contractAddress: sale.nft.contract.address,
      tokenId: sale.nft.tokenId,
      tokenType: sale.nft.tokenType,
      tokenRef: makeTokenRef(
        sale.nft.contract.chainId,
        sale.nft.contract.address,
        sale.nft.tokenId,
      ),
      domainId: sale.nft.domainId,
      buyer: sale.buyer,
      seller: sale.seller,
      currency: sale.payment.price.currency,
      amount: sale.payment.price.amount,
      timestamp: sale.event.timestamp,
    });
  });
}
