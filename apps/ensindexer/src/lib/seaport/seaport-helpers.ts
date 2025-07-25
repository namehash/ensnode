import { Context } from "ponder:registry";
import schema from "ponder:schema";
import { Address, Hex } from "viem";

/**
 * Lookup the domain id for a tokenId
 * @param context - ponder context
 * @param contractAddress - contract address of the NFT
 * @param tokenId - tokenId of the NFT
 */
export async function lookupDomainId(
  context: Context,
  contractAddress: Address,
  tokenId: string,
): Promise<Hex | null> {
  const tokenIdHex = `0x${BigInt(tokenId).toString(16).padStart(64, "0")}` as Hex;

  // OLD ENS Registry: tokenId is labelhash, need to find domain by labelhash
  if (contractAddress === "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85") {
    const domains = await context.db.sql.query.domain.findMany({
      where: (table, { eq }) => eq(table.labelhash, tokenIdHex),
      limit: 1,
    });

    const domain = domains[0];
    return domain?.id || null;
  }
  // all remaining protocols we use namehash
  else {
    const domain = await context.db.find(schema.domain, {
      id: tokenIdHex,
    });

    return domain?.id || null;
  }
}
