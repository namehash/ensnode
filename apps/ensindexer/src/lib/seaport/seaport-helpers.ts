import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, Hex, zeroAddress } from "viem";

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

/**
 * Looks up domain ID from contract address and token ID
 * ENS Registry (0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85) uses labelhash as tokenId
 * Name Wrapper (0x0635513f179D50A207757E05759CbD106d7dFcE8) uses namehash as tokenId
 */
export async function lookupDomainId(
  context: Context,
  contractAddress: Address,
  tokenId: string,
): Promise<Hex | null> {
  const tokenIdHex = `0x${BigInt(tokenId).toString(16).padStart(64, "0")}` as Hex;

  // ENS Registry: tokenId is labelhash, need to find domain by labelhash
  if (contractAddress === "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85") {
    const domains = await context.db.sql.query.domain.findMany({
      where: (table, { eq }) => eq(table.labelhash, tokenIdHex),
      limit: 1,
    });

    const domain = domains[0];
    return domain?.id || null;
  }

  // Name Wrapper: tokenId is namehash, which is the domain ID
  if (contractAddress === "0x0635513f179D50A207757E05759CbD106d7dFcE8") {
    // Verify the domain exists using find (since we're looking up by primary key)
    const domain = await context.db.find(schema.domain, {
      id: tokenIdHex,
    });

    return domain?.id || null;
  }

  return null;
}
