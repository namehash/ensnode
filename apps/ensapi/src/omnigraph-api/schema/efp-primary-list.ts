import { eq } from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";
import type { Hex } from "viem";

import di from "@/di";
import { efpAccountMetadataId } from "@/omnigraph-api/schema/efp-ids";

/** The EFP AccountMetadata key whose value is an account's primary-list token id. */
export const EFP_PRIMARY_LIST_KEY = "primary-list";

/**
 * Decode a `primary-list` account-metadata value (an abi-encoded `uint256` token id) into a decimal
 * token-id string, or `null` if it isn't a well-formed value.
 */
function decodePrimaryListTokenId(value: Hex): string | null {
  if (!value || value === "0x") return null;
  try {
    return BigInt(value).toString();
  } catch {
    return null;
  }
}

/**
 * Resolve an account's validated primary EFP list token id: the list named by the account's
 * `primary-list` metadata, returned only when that list's `user` role matches the account (the EFP
 * two-step Primary List validation). `null` if unset, not indexed, or unvalidated.
 *
 * Shared by `efp.primaryList(address)` and `Account.efp.primaryList`.
 */
export async function resolveValidatedPrimaryListTokenId(
  address: NormalizedAddress,
): Promise<string | null> {
  const { ensDb, ensIndexerSchema } = di.context;

  const [metadata] = await ensDb
    .select({ value: ensIndexerSchema.efpAccountMetadata.value })
    .from(ensIndexerSchema.efpAccountMetadata)
    .where(
      eq(
        ensIndexerSchema.efpAccountMetadata.id,
        efpAccountMetadataId(address, EFP_PRIMARY_LIST_KEY),
      ),
    )
    .limit(1);
  if (!metadata) return null;

  const tokenId = decodePrimaryListTokenId(metadata.value);
  if (tokenId === null) return null;

  // EFP "Primary List" is only valid when the named list's `user` role matches the account.
  // Compare case-insensitively so validation is independent of input casing.
  const [list] = await ensDb
    .select({ user: ensIndexerSchema.efpLists.user })
    .from(ensIndexerSchema.efpLists)
    .where(eq(ensIndexerSchema.efpLists.tokenId, tokenId))
    .limit(1);
  if (!list?.user || list.user.toLowerCase() !== address.toLowerCase()) return null;

  return tokenId;
}
