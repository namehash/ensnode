import {
  and,
  arrayOverlaps,
  asc,
  desc,
  eq,
  gt,
  isNotNull,
  lt,
  not,
  type SQL,
  sql,
} from "drizzle-orm";
import type { NormalizedAddress } from "enssdk";
import type { Hex } from "viem";

import di from "@/di";
import { cursors } from "@/omnigraph-api/lib/cursors";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";
import {
  decodePrimaryListTokenId,
  EFP_PRIMARY_LIST_KEY,
  resolveValidatedPrimaryListTokenId,
} from "@/omnigraph-api/schema/efp-primary-list";

/** The only EFP record type indexed: an address record (the target a list follows). */
export const EFP_ADDRESS_RECORD_TYPE = 1;

/**
 * EFP record tags that exclude a record from the social follow graph: a `block`ed or `mute`d address
 * is present in a list but is not a "follow". `following` / `followers` omit any record carrying one.
 */
export const EFP_NON_FOLLOW_TAGS = ["block", "mute"] as const;

/** Relay connection args for a connection of account addresses, cursored by the address itself. */
export const ADDRESS_PAGINATED_CONNECTION_ARGS = {
  toCursor: (address: NormalizedAddress) => cursors.encode(address),
  defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
  maxSize: PAGINATION_DEFAULT_MAX_SIZE,
} as const;

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

  const [list] = await ensDb
    .select({
      chainId: ensIndexerSchema.efpLists.listStorageLocationChainId,
      contractAddress: ensIndexerSchema.efpLists.listStorageLocationContractAddress,
      slot: ensIndexerSchema.efpLists.listStorageLocationSlot,
    })
    .from(ensIndexerSchema.efpLists)
    .where(eq(ensIndexerSchema.efpLists.id, tokenId))
    .limit(1);
  if (!list || list.chainId === null || list.contractAddress === null || list.slot === null) {
    return sql`false`;
  }

  // `and` over these concrete conditions is always defined; the `?? sql`false`` keeps the return
  // total without a non-null assertion.
  return (
    and(
      eq(ensIndexerSchema.efpListRecords.chainId, list.chainId),
      eq(ensIndexerSchema.efpListRecords.contractAddress, list.contractAddress),
      eq(ensIndexerSchema.efpListRecords.slot, list.slot),
      eq(ensIndexerSchema.efpListRecords.recordType, EFP_ADDRESS_RECORD_TYPE),
      not(arrayOverlaps(ensIndexerSchema.efpListRecords.tags, [...EFP_NON_FOLLOW_TAGS])),
    ) ?? sql`false`
  );
}

/**
 * One distinct candidate follower of `target`: an account that is the `user` of one or more lists
 * holding `target` as a follow, paired with those lists' token ids and the account's raw
 * `primary-list` metadata. A candidate is a real follower only once validated (see
 * {@link isValidatedFollower}): the follow must live in the account's *primary* list.
 */
interface FollowerCandidate {
  follower: NormalizedAddress;
  /** Token ids of the candidate's lists that hold `target` (cast to text for an exact bigint match). */
  candidateTokenIds: string[];
  /** The candidate's raw `primary-list` metadata value, or null if it has none. */
  primaryListValue: Hex | null;
}

/** A candidate is a follower iff its validated primary list is one of the lists holding `target`. */
function isValidatedFollower(candidate: FollowerCandidate): boolean {
  if (candidate.primaryListValue === null) return false;
  const primaryListTokenId = decodePrimaryListTokenId(candidate.primaryListValue);
  if (primaryListTokenId === null) return false;
  return candidate.candidateTokenIds.includes(primaryListTokenId.toString());
}

/**
 * Fetch one batch of distinct candidate followers of `target`, ordered by follower address and
 * paginated by it. Joins each address record for `target` to the lists pointing at its storage
 * location (so every list holding `target` counts, matching `EfpList.records`), then to the list
 * `user`'s `primary-list` metadata; groups to one row per candidate follower.
 */
function fetchFollowerCandidates(
  target: NormalizedAddress,
  cursor: { after?: NormalizedAddress; before?: NormalizedAddress },
  inverted: boolean,
  limit: number,
): Promise<FollowerCandidate[]> {
  const { ensDb, ensIndexerSchema } = di.context;
  const { efpListRecords, efpLists, efpAccountMetadata } = ensIndexerSchema;

  return (
    ensDb
      .select({
        follower: efpLists.user,
        candidateTokenIds: sql<string[]>`array_agg(${efpLists.id}::text)`,
        primaryListValue: efpAccountMetadata.value,
      })
      .from(efpListRecords)
      // A list holds `target` when `target` is a record at the list's decoded storage location.
      .innerJoin(
        efpLists,
        and(
          eq(efpLists.listStorageLocationChainId, efpListRecords.chainId),
          eq(efpLists.listStorageLocationContractAddress, efpListRecords.contractAddress),
          eq(efpLists.listStorageLocationSlot, efpListRecords.slot),
        ),
      )
      .leftJoin(
        efpAccountMetadata,
        and(
          eq(efpAccountMetadata.address, efpLists.user),
          eq(efpAccountMetadata.key, EFP_PRIMARY_LIST_KEY),
        ),
      )
      .where(
        and(
          eq(efpListRecords.recordData, target),
          eq(efpListRecords.recordType, EFP_ADDRESS_RECORD_TYPE),
          not(arrayOverlaps(efpListRecords.tags, [...EFP_NON_FOLLOW_TAGS])),
          isNotNull(efpLists.user),
          cursor.after ? gt(efpLists.user, cursor.after) : undefined,
          cursor.before ? lt(efpLists.user, cursor.before) : undefined,
        ),
      )
      .groupBy(efpLists.user, efpAccountMetadata.value)
      .orderBy(inverted ? desc(efpLists.user) : asc(efpLists.user))
      .limit(limit) as Promise<FollowerCandidate[]>
  );
}

/**
 * The validated followers of `target`, ordered by address and paginated by it. Validation (does the
 * follow live in the candidate's *primary* list?) decodes the `primary-list` metadata in app — a
 * uint256 that Postgres can't compare to the numeric `tokenId` — so candidates are over-fetched in
 * batches until `limit` validated followers are found (or the candidates are exhausted).
 *
 * Used by `Account.efp.followers`.
 */
export async function fetchValidatedFollowers(
  target: NormalizedAddress,
  {
    before,
    after,
    limit,
    inverted,
  }: { before?: string; after?: string; limit: number; inverted: boolean },
): Promise<NormalizedAddress[]> {
  const cursor: { after?: NormalizedAddress; before?: NormalizedAddress } = {
    after: after ? cursors.decode<NormalizedAddress>(after) : undefined,
    before: before ? cursors.decode<NormalizedAddress>(before) : undefined,
  };

  const batchSize = Math.max(limit * 4, 64);
  const followers: NormalizedAddress[] = [];

  for (;;) {
    const candidates = await fetchFollowerCandidates(target, cursor, inverted, batchSize);
    if (candidates.length === 0) break;

    for (const candidate of candidates) {
      // Advance the moving cursor past every candidate, validated or not, so the next batch resumes
      // after the last one examined.
      if (inverted) cursor.before = candidate.follower;
      else cursor.after = candidate.follower;

      if (!isValidatedFollower(candidate)) continue;
      followers.push(candidate.follower);
      if (followers.length >= limit) return followers;
    }

    if (candidates.length < batchSize) break;
  }

  return followers;
}

/**
 * Count the validated followers of `target` by enumerating every candidate. Resolved lazily (only
 * when `totalCount` is selected); the cost scales with how many lists hold `target`.
 *
 * Used by `Account.efp.followers`.
 */
export async function countValidatedFollowers(target: NormalizedAddress): Promise<number> {
  const cursor: { after?: NormalizedAddress } = {};
  const batchSize = 500;
  let count = 0;

  for (;;) {
    const candidates = await fetchFollowerCandidates(target, cursor, false, batchSize);
    if (candidates.length === 0) break;

    for (const candidate of candidates) {
      cursor.after = candidate.follower;
      if (isValidatedFollower(candidate)) count++;
    }

    if (candidates.length < batchSize) break;
  }

  return count;
}
