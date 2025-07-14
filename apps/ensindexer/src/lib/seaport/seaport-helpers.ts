import { Context } from "ponder:registry";
import { Address, Hex, zeroAddress } from "viem";
import schema from "ponder:schema";

export async function upsertCurrency(context: Context, tokenAddress: Address): Promise<Hex> {
  const currencyId = tokenAddress as Hex;

  const existingCurrency = await context.db.find(schema.currency, {
    id: currencyId,
  });

  if (!existingCurrency) {
    if (tokenAddress === zeroAddress) {
      await context.db.insert(schema.currency).values({
        id: currencyId,
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        contractAddress: zeroAddress,
        chainId: context.chain.id,
      });
    } else {
      // may have to fetch tokenMetadata from a provider (coingecko, binance, etc)
      await context.db.insert(schema.currency).values({
        id: currencyId,
        name: null,
        symbol: null,
        decimals: 18,
        contractAddress: tokenAddress,
        chainId: context.chain.id,
      });
    }
  }

  return currencyId;
}