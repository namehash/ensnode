import { type ResolveCursorConnectionArgs, resolveCursorConnection } from "@pothos/plugin-relay";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import {
  type Address,
  bigintToCoinType,
  type ChainId,
  type CoinType,
  type DomainId,
  type InterpretedName,
  type Node,
  type NormalizedAddress,
} from "enssdk";

import di from "@/di";
import { cursors } from "@/omnigraph-api/lib/cursors";
import { lazyConnection } from "@/omnigraph-api/lib/lazy-connection";
import {
  PAGINATION_DEFAULT_MAX_SIZE,
  PAGINATION_DEFAULT_PAGE_SIZE,
} from "@/omnigraph-api/schema/constants";

/**
 * GraphQL parent model for a `NameReference`: a single indexed `addr()` record that points at
 * `account`, resolved to the canonical Domain whose `canonicalNode` matches the record's `node`.
 */
export interface NameReferenceModel {
  /** The Account whose `addr()` records are referenced, used to compute `match`. */
  account: NormalizedAddress;
  /** The canonical Domain whose `addr(coinType)` record points at `account`. */
  domainId: DomainId;
  /** The canonical Name of `domainId`, used to compute `match`. */
  canonicalName: InterpretedName;
  /** The CoinType of the matching `addr()` record. */
  coinType: CoinType;
  /** The chainId of the Resolver holding the matching record. */
  resolverChainId: ChainId;
  /** The address of the Resolver holding the matching record. */
  resolverAddress: Address;
}

/**
 * Opaque keyset cursor built from the `resolver_address_records` primary key columns
 * (`chainId`, `address`, `node`, `coinType`), in the order used for pagination. `value` is not a key
 * column — it is the constant `value = account` filter — so it is not part of the cursor.
 */
interface NameReferenceCursor {
  node: Node;
  coinType: bigint;
  chainId: ChainId;
  address: Address;
}

/** Internal connection node: the public model plus the keyset cursor for this row. */
type NameReferenceRow = NameReferenceModel & { __cursor: NameReferenceCursor };

/**
 * Resolver for `Account.nameReferences`: the names whose indexed `addr()` record points at
 * `account`.
 *
 * Reads `resolver_address_records WHERE value = account [AND coin_type = coinType]` and INNER JOINs
 * each record's `node` to its canonical Domain via the materialized `domain.canonicalNode`. The
 * join is inner: records whose `node` has no canonical Domain (e.g. non-canonical names) are
 * omitted, since there is no Name to surface for them.
 */
export function resolveAccountNameReferences({
  account,
  coinType,
  ...connectionArgs
}: {
  account: NormalizedAddress;
  coinType?: CoinType | null;
  first?: number | null;
  last?: number | null;
  before?: string | null;
  after?: string | null;
}) {
  const { ensDb, ensIndexerSchema } = di.context;
  const rar = ensIndexerSchema.resolverAddressRecord;
  const domain = ensIndexerSchema.domain;

  const scope = and(
    eq(rar.value, account),
    // @TODO(cointype-bigint): drop `BigInt(...)` once resolverAddressRecord.coinType is CoinType. See #2293.
    coinType !== undefined && coinType !== null ? eq(rar.coinType, BigInt(coinType)) : undefined,
  );
  const joinOn = eq(domain.canonicalNode, rar.node);

  // deterministic keyset order over the rar primary key columns (a permutation of the PK; `value`
  // is not a key column — it is the constant `value = account` filter)
  const keysetTuple = sql`(${rar.node}, ${rar.coinType}, ${rar.chainId}, ${rar.address})`;
  const cursorTuple = (c: NameReferenceCursor) =>
    sql`(${c.node}, ${c.coinType}, ${c.chainId}, ${c.address})`;

  return lazyConnection({
    totalCount: async () => {
      const rows = await ensDb
        .select({ count: count() })
        .from(rar)
        .innerJoin(domain, joinOn)
        .where(scope);
      return rows[0].count;
    },

    connection: () =>
      resolveCursorConnection(
        {
          toCursor: (row: NameReferenceRow) => cursors.encode<NameReferenceCursor>(row.__cursor),
          defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
          maxSize: PAGINATION_DEFAULT_MAX_SIZE,
          args: connectionArgs,
        },
        async ({ before, after, limit, inverted }: ResolveCursorConnectionArgs) => {
          const beforeCursor = before ? cursors.decode<NameReferenceCursor>(before) : undefined;
          const afterCursor = after ? cursors.decode<NameReferenceCursor>(after) : undefined;

          const rows = await ensDb
            .select({
              node: rar.node,
              coinType: rar.coinType,
              resolverChainId: rar.chainId,
              resolverAddress: rar.address,
              domainId: domain.id,
              canonicalName: domain.canonicalName,
            })
            .from(rar)
            .innerJoin(domain, joinOn)
            .where(
              and(
                scope,
                beforeCursor ? sql`${keysetTuple} < ${cursorTuple(beforeCursor)}` : undefined,
                afterCursor ? sql`${keysetTuple} > ${cursorTuple(afterCursor)}` : undefined,
              ),
            )
            .orderBy(
              inverted ? desc(rar.node) : asc(rar.node),
              inverted ? desc(rar.coinType) : asc(rar.coinType),
              inverted ? desc(rar.chainId) : asc(rar.chainId),
              inverted ? desc(rar.address) : asc(rar.address),
            )
            .limit(limit);

          return rows.map(
            (row): NameReferenceRow => ({
              account,
              domainId: row.domainId,
              // non-null: the INNER JOIN matches only canonical Domains, which have a canonicalName
              canonicalName: row.canonicalName as InterpretedName,
              // @TODO(cointype-bigint): drop `bigintToCoinType` once resolverAddressRecord.coinType is CoinType. See #2293.
              coinType: bigintToCoinType(row.coinType),
              resolverChainId: row.resolverChainId,
              resolverAddress: row.resolverAddress,
              __cursor: {
                node: row.node,
                coinType: row.coinType,
                chainId: row.resolverChainId,
                address: row.resolverAddress,
              },
            }),
          );
        },
      ),
  });
}
