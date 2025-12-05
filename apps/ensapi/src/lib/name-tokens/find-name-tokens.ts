import { and, desc, eq, type SQL } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  bigIntToNumber,
  deserializeAccountId,
  deserializeAssetId,
  type NameToken,
  type NameTokensFilter,
  NameTokensFilterTypes,
  type NameTokensOrder,
  NameTokensOrders,
  type NFTMintStatus,
  NFTMintStatuses,
  type RegisteredNameToken,
  type RegisteredNameTokenStatus,
  RegisteredNameTokenStatuses,
  type RegistrationLifecycle,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * Build SQL for where clause from provided filter param.
 */
function buildWhereClause(filters: NameTokensFilter[] | undefined): SQL[] {
  const binaryOperators: SQL[] =
    filters?.map((filter) => {
      switch (filter.filterType) {
        case NameTokensFilterTypes.ByDomainId:
          // apply domainId equality filter
          return eq(schema.nameTokens.domainId, filter.domainId);

        default:
          // Invariant: Unknown filter type — should never occur
          throw new Error(`Unknown filter type`);
      }
    }) ?? [];

  return binaryOperators;
}

/**
 * Build SQL for order clause from provided order param.
 */
function buildOrderByClause(order: NameTokensOrder): SQL {
  switch (order) {
    case NameTokensOrders.LatestNameTokens:
      return desc(schema.nameTokens.tokenId);
  }
}

export interface FindNameTokensOptions {
  filters?: NameTokensFilter[];

  orderBy: NameTokensOrder;

  limit: number;

  accurateAsOf: UnixTimestamp;
}

/**
 * Internal function which executes a single query to get all data required to
 * build a list of {@link RegisteredNameToken} objects.
 */
export async function _findNameTokens(options: FindNameTokensOptions) {
  const query = db
    .select({
      nameTokens: schema.nameTokens,
      registrationLifecycles: schema.registrationLifecycles,
      subregistries: schema.subregistries,
    })
    .from(schema.nameTokens)
    // join Registration Lifecycles associated with Name Tokens
    .innerJoin(
      schema.registrationLifecycles,
      eq(schema.nameTokens.domainId, schema.registrationLifecycles.node),
    )
    // join Subregistries associated with Registration Lifecycles
    .innerJoin(
      schema.subregistries,
      eq(schema.registrationLifecycles.subregistryId, schema.subregistries.subregistryId),
    )
    .where(and(...buildWhereClause(options.filters)))
    .orderBy(buildOrderByClause(options.orderBy))
    .limit(options.limit);

  const records = await query;

  return records;
}

type MapToRegisteredNameTokenArgs = Awaited<ReturnType<typeof _findNameTokens>>[0];

/**
 * Internal function to map a record returned
 * from {@link _findNameTokens}
 * into the {@link RegisteredNameToken} object.
 */
function _mapToNamedRegistrarAction(
  record: MapToRegisteredNameTokenArgs,
  accurateAsOf: UnixTimestamp,
): RegisteredNameToken {
  const assetId = deserializeAssetId(record.nameTokens.id);
  const token = {
    domainAsset: {
      ...assetId,
      domainId: record.nameTokens.domainId,
    },
    owner: record.nameTokens.owner,
    mintStatus: record.nameTokens.mintStatus as NFTMintStatus,
  } satisfies NameToken;

  // build Registration Lifecycle object
  const registrationLifecycle = {
    subregistry: {
      subregistryId: deserializeAccountId(record.subregistries.subregistryId),
      node: record.subregistries.node,
    },
    node: record.registrationLifecycles.node,
    expiresAt: bigIntToNumber(record.registrationLifecycles.expiresAt),
  } satisfies RegistrationLifecycle;

  const tokenStatus: RegisteredNameTokenStatus =
    token.mintStatus === NFTMintStatuses.Minted && registrationLifecycle.expiresAt < accurateAsOf
      ? RegisteredNameTokenStatuses.Expired
      : token.mintStatus;

  return {
    token,
    registrationLifecycle,
    tokenStatus,
  };
}

/**
 * Find Name Tokens, including RegistrationLifecycle info
 *
 * @param {SQL} options.filters configures which filters to apply while generating results.
 * @param {SQL} options.orderBy configures which column and order apply to results.
 * @param {number} options.limit configures how many items to include in results.
 */
export async function findNameTokens(
  options: FindNameTokensOptions,
): Promise<RegisteredNameToken[]> {
  const records = await _findNameTokens(options);

  return records.map((record) => _mapToNamedRegistrarAction(record, options.accurateAsOf));
}
