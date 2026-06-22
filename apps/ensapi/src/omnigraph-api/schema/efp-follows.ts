import {
  and,
  arrayOverlaps,
  asc,
  countDistinct,
  desc,
  eq,
  gt,
  lt,
  not,
  type SQL,
  sql,
} from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";
import { EFP_PRIMARY_LIST_KEY } from "enssdk/efp";

import di from "@/di";
import { cursors } from "@/omnigraph-api/lib/cursors";
import { decodedStorageLocation } from "@/omnigraph-api/schema/efp-list";
import { resolveValidatedPrimaryListTokenId } from "@/omnigraph-api/schema/efp-primary-list";

/** The only EFP record type indexed: an address record (the target a list follows). */
export const EFP_ADDRESS_RECORD_TYPE = 1;

/**
 * EFP record tags that exclude a record from the social follow graph: a `block`ed or `mute`d address
 * is present in a list but is not a "follow". `following` / `followers` omit any record carrying one.
 */
export const EFP_NON_FOLLOW_TAGS = ["block", "mute"] as const;

/**
 * The `efp_list_records` filter selecting a list's follows: address records at the given storage
 * location that are not tagged `block` / `mute`. Returns an always-false filter when the account has
 * no validated primary list (or it has no storage location yet), so `following` is empty.
 *
 * Used by `Account.efp.following`.
 */
export async function buildFollowingScope(address: NormalizedAddress): Promise<SQL> {
  const { ensDb, ensIndexerSchema } = di.context;

  const tokenId = await resolveValidatedPrimaryListTokenId(address);
  if (tokenId === null) return sql`false`;

  const list = await ensDb.query.efpLists.findFirst({
    columns: {
      listStorageLocationChainId: true,
      listStorageLocationContractAddress: true,
      listStorageLocationSlot: true,
    },
    where: (l, { eq }) => eq(l.id, tokenId),
  });
  const location = list && decodedStorageLocation(list);
  if (!location) return sql`false`;

  // `and` over these concrete conditions is always defined; the `?? sql`false`` keeps the return
  // total without a non-null assertion.
  return (
    and(
      eq(ensIndexerSchema.efpListRecords.chainId, location.chainId),
      eq(ensIndexerSchema.efpListRecords.contractAddress, location.contractAddress),
      eq(ensIndexerSchema.efpListRecords.slot, location.slot),
      eq(ensIndexerSchema.efpListRecords.recordType, EFP_ADDRESS_RECORD_TYPE),
      not(arrayOverlaps(ensIndexerSchema.efpListRecords.tags, [...EFP_NON_FOLLOW_TAGS])),
    ) ?? sql`false`
  );
}

/**
 * The joins + base filter for "accounts whose validated primary list holds `target` as a follow".
 *
 * A record for `target` joins to every list at its storage location, then to the list `user`'s
 * `primary-list` metadata — but only when that metadata's decoded `primaryListTokenId` IS this list
 * (`= efp_lists.id`) AND the metadata's owner is the list's `user` (`address = efp_lists.user`). That
 * pair of equalities is exactly the EFP two-step Primary List validation, expressed in SQL, so the
 * whole social graph is one join with no in-app decode/enumeration.
 */
function followersJoins() {
  const { efpListRecords, efpLists, efpAccountMetadata } = di.context.ensIndexerSchema;

  return {
    efpListRecords,
    efpLists,
    efpAccountMetadata,
    listAtRecordLocation: and(
      eq(efpLists.listStorageLocationChainId, efpListRecords.chainId),
      eq(efpLists.listStorageLocationContractAddress, efpListRecords.contractAddress),
      eq(efpLists.listStorageLocationSlot, efpListRecords.slot),
    ),
    listIsValidatedPrimary: and(
      eq(efpAccountMetadata.address, efpLists.user),
      eq(efpAccountMetadata.key, EFP_PRIMARY_LIST_KEY),
      eq(efpAccountMetadata.primaryListTokenId, efpLists.id),
    ),
    followsTarget: (target: NormalizedAddress) =>
      and(
        eq(efpListRecords.recordData, target),
        eq(efpListRecords.recordType, EFP_ADDRESS_RECORD_TYPE),
        not(arrayOverlaps(efpListRecords.tags, [...EFP_NON_FOLLOW_TAGS])),
      ),
  };
}

/**
 * The validated followers of `target` (distinct list `user`s), ordered by address and paginated by
 * it. Used by `Account.efp.followers`.
 */
export async function fetchFollowers(
  target: NormalizedAddress,
  {
    before,
    after,
    limit,
    inverted,
  }: { before?: string; after?: string; limit: number; inverted: boolean },
): Promise<NormalizedAddress[]> {
  const { ensDb } = di.context;
  const { efpListRecords, efpLists, efpAccountMetadata, ...j } = followersJoins();

  const afterCursor = after ? cursors.decode<NormalizedAddress>(after) : undefined;
  const beforeCursor = before ? cursors.decode<NormalizedAddress>(before) : undefined;

  const rows = await ensDb
    .selectDistinct({ follower: efpLists.user })
    .from(efpListRecords)
    .innerJoin(efpLists, j.listAtRecordLocation)
    .innerJoin(efpAccountMetadata, j.listIsValidatedPrimary)
    .where(
      and(
        j.followsTarget(target),
        afterCursor ? gt(efpLists.user, afterCursor) : undefined,
        beforeCursor ? lt(efpLists.user, beforeCursor) : undefined,
      ),
    )
    .orderBy(inverted ? desc(efpLists.user) : asc(efpLists.user))
    .limit(limit);

  // `user` is non-null on every joined row (the metadata join is on `address = user`), but the column
  // type is nullable — drop any null without a cast.
  return rows.flatMap((row) => (row.follower === null ? [] : [row.follower]));
}

/**
 * Count the validated followers of `target`. Resolved lazily (only when `totalCount` is selected).
 *
 * Used by `Account.efp.followers`.
 */
export async function countFollowers(target: NormalizedAddress): Promise<number> {
  const { ensDb } = di.context;
  const { efpListRecords, efpLists, efpAccountMetadata, ...j } = followersJoins();

  const [row] = await ensDb
    .select({ count: countDistinct(efpLists.user) })
    .from(efpListRecords)
    .innerJoin(efpLists, j.listAtRecordLocation)
    .innerJoin(efpAccountMetadata, j.listIsValidatedPrimary)
    .where(j.followsTarget(target));

  return row?.count ?? 0;
}
