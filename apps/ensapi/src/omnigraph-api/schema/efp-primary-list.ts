import type { NormalizedAddress, TokenId } from "enssdk";
import { EFP_PRIMARY_LIST_KEY } from "enssdk/efp";

import di from "@/di";

/**
 * Resolve an account's validated primary EFP list token id: the list named by the account's
 * `primary-list` metadata, returned only when that list's `user` role matches the account (the EFP
 * two-step Primary List validation). `null` if unset, not indexed, or unvalidated.
 *
 * The `primary-list` value is decoded into the numeric `efp_account_metadata.primaryListTokenId`
 * column at index time, so this is two point lookups (no in-app decode).
 *
 * Used by `Account.efp.following`.
 */
export async function resolveValidatedPrimaryListTokenId(
  address: NormalizedAddress,
): Promise<TokenId | null> {
  const { ensDb } = di.context;

  const metadata = await ensDb.query.efpAccountMetadata.findFirst({
    columns: { primaryListTokenId: true },
    where: (m, { and, eq }) => and(eq(m.address, address), eq(m.key, EFP_PRIMARY_LIST_KEY)),
  });
  const tokenId = metadata?.primaryListTokenId ?? null;
  if (tokenId === null) return null;

  // EFP "Primary List" is only valid when the named list's `user` role matches the account.
  const list = await ensDb.query.efpLists.findFirst({
    columns: { user: true },
    where: (l, { eq }) => eq(l.id, tokenId),
  });
  if (!list?.user || list.user !== address) return null;

  return tokenId;
}
