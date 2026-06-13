import type { NormalizedAddress, TokenId } from "enssdk";
import { type Hex, hexToBigInt, size } from "viem";

import di from "@/di";

/** The EFP AccountMetadata key whose value is an account's primary-list token id. */
export const EFP_PRIMARY_LIST_KEY = "primary-list";

/** A valid `primary-list` value is `abi.encodePacked(uint256 tokenId)`: exactly a 32-byte uint256. */
const PRIMARY_LIST_VALUE_SIZE = 32;

/**
 * Decode a `primary-list` account-metadata value (`abi.encodePacked(uint256 tokenId)`) into a
 * token id, or `null` if it isn't well-formed. EFP defines the value as exactly a 32-byte uint256,
 * so reject any other length rather than coerce a malformed value (e.g. `0x01`) into a real token id.
 */
export function decodePrimaryListTokenId(value: Hex): TokenId | null {
  if (size(value) !== PRIMARY_LIST_VALUE_SIZE) return null;
  return hexToBigInt(value) as TokenId;
}

/**
 * Resolve an account's validated primary EFP list token id: the list named by the account's
 * `primary-list` metadata, returned only when that list's `user` role matches the account (the EFP
 * two-step Primary List validation). `null` if unset, not indexed, or unvalidated.
 *
 * Used by `Account.efp.primaryList`.
 */
export async function resolveValidatedPrimaryListTokenId(
  address: NormalizedAddress,
): Promise<TokenId | null> {
  const { ensDb } = di.context;

  const metadata = await ensDb.query.efpAccountMetadata.findFirst({
    columns: { value: true },
    where: (m, { and, eq }) => and(eq(m.address, address), eq(m.key, EFP_PRIMARY_LIST_KEY)),
  });
  if (!metadata) return null;

  const tokenId = decodePrimaryListTokenId(metadata.value);
  if (tokenId === null) return null;

  // EFP "Primary List" is only valid when the named list's `user` role matches the account.
  const list = await ensDb.query.efpLists.findFirst({
    columns: { user: true },
    where: (l, { eq }) => eq(l.id, tokenId),
  });
  if (!list?.user || list.user !== address) return null;

  return tokenId;
}
