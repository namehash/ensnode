import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { PluginName, uint256ToHex32 } from "@ensnode/ensnode-sdk";
import { AssetId, ChainId } from "caip";

import config from "@/config";
import { upsertAccount } from "@/lib/db-helpers";
import { makeEventId } from "@/lib/ids";
import { namespaceContract } from "@/lib/plugin-helpers";
import { getSupportedSaleFromOrderFulfilledEvent } from "@/lib/tokenscope/seaport";

/**
 * Registers event handlers with Ponder.
 */
export default function () {
  const pluginName = PluginName.TokenScope;

  ponder.on(namespaceContract(pluginName, "Seaport:OrderFulfilled"), async ({ context, event }) => {
    const sale = getSupportedSaleFromOrderFulfilledEvent(config.namespace, context.chain.id, event);

    // TODO: remove these invariants and just store as bigint like god intended
    if (event.block.timestamp > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        `Error building onchain event ref: block timestamp is too large: ${event.block.timestamp}`,
      );
    }

    if (event.block.number > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        `Error building onchain event ref: block number is too large: ${event.block.number}`,
      );
    }

    const blockNumber = Number(event.block.number);
    const timestamp = Number(event.block.timestamp);

    // no supported sale detected in event, no-op
    if (!sale) return;

    // upsert buyer and seller accounts
    await upsertAccount(context, sale.seller);
    await upsertAccount(context, sale.buyer);

    // insert NameSale entity
    await context.db.insert(schema.nameSales).values({
      id: makeEventId(context.chain.id, event.block.number, event.log.logIndex),
      chainId: sale.nft.contract.chainId,
      blockNumber,
      logIndex: event.log.logIndex,
      transactionHash: event.transaction.hash,
      orderHash: sale.orderHash,
      contractAddress: sale.nft.contract.address,
      tokenId: sale.nft.tokenId,
      assetNamespace: sale.nft.assetNamespace,
      assetId: AssetId.format({
        chainId: ChainId.format({
          namespace: "eip155",
          reference: sale.nft.contract.chainId.toString(),
        }),
        assetName: { namespace: sale.nft.assetNamespace, reference: sale.nft.contract.address },
        tokenId: uint256ToHex32(sale.nft.tokenId),
      }),
      domainId: sale.nft.domainId,
      buyer: sale.buyer,
      seller: sale.seller,
      currency: sale.payment.price.currency,
      amount: sale.payment.price.amount,
      timestamp,
    });
  });
}
