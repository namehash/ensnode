import { and, desc, eq, isNotNull, not, type SQL } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  type BlockRef,
  bigIntToNumber,
  deserializeAccountId,
  type InterpretedName,
  type NamedRegistrarAction,
  priceEth,
  type RegistrarAction,
  type RegistrarActionPricingAvailable,
  type RegistrarActionPricingUnknown,
  type RegistrarActionReferralAvailable,
  type RegistrarActionReferralNotApplicable,
  type RegistrarActionsFilter,
  RegistrarActionsFilterTypes,
  type RegistrarActionsOrder,
  RegistrarActionsOrders,
  type RegistrationLifecycle,
  ZERO_ENCODED_REFERRER,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

/**
 * Build SQL for order clause from provided order param.
 */
function buildOrderByClause(order: RegistrarActionsOrder): SQL {
  switch (order) {
    case RegistrarActionsOrders.LatestRegistrarActions:
      return desc(schema.registrarActions.timestamp);
  }
}

/**
 * Build SQL for where clause from provided filter param.
 */
function buildWhereClause(filters: RegistrarActionsFilter[] | undefined): SQL[] {
  const binaryOperators: SQL[] =
    filters?.map((filter) => {
      switch (filter.filterType) {
        case RegistrarActionsFilterTypes.BySubregistryNode:
          // apply subregistry node equality filter
          return eq(schema.subregistries.node, filter.value);

        case RegistrarActionsFilterTypes.WithEncodedReferral: {
          // apply referral encoded referrer inclusion filter
          const filterSql = and(
            isNotNull(schema.registrarActions.encodedReferrer),
            not(eq(schema.registrarActions.encodedReferrer, ZERO_ENCODED_REFERRER)),
          );

          // Invariant: filterSql is `SQL` object - should never occur
          if (typeof filterSql === "undefined") {
            throw new Error(
              `Filter SQL must be built successfully for 'WithEncodedReferral' filter on Registrar Actions.`,
            );
          }

          return filterSql;
        }

        default:
          // Invariant: Unknown filter type — should never occur
          throw new Error(`Unknown filter type`);
      }
    }) ?? [];

  return binaryOperators;
}

interface FindRegistrarActionsOptions {
  filters?: RegistrarActionsFilter[];

  orderBy: RegistrarActionsOrder;

  limit: number;
}

/**
 * Internal function which executes a single query to get all data required to
 * build a list of {@link NamedRegistrarAction} objects.
 */
export async function _findRegistrarActions(options: FindRegistrarActionsOptions) {
  const query = db
    .select({
      registrarActions: schema.registrarActions,
      registrationLifecycles: schema.registrationLifecycles,
      subregistries: schema.subregistries,
      domain: {
        labelName: schema.subgraph_domain.labelName,
        name: schema.subgraph_domain.name,
      },
    })
    .from(schema.registrarActions)
    // join Registration Lifecycles associated with Registrar Actions
    .innerJoin(
      schema.registrationLifecycles,
      eq(schema.registrarActions.node, schema.registrationLifecycles.node),
    )
    // join Domains associated with Registration Lifecycles
    .innerJoin(
      schema.subgraph_domain,
      eq(schema.registrationLifecycles.node, schema.subgraph_domain.id),
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

type MapToNamedRegistrarActionArgs = Awaited<ReturnType<typeof _findRegistrarActions>>[0];

/**
 * Internal function to map a record returned
 * from {@link _findRegistrarActions}
 * into the {@link NamedRegistrarAction} object.
 */
function _mapToNamedRegistrarAction(record: MapToNamedRegistrarActionArgs): NamedRegistrarAction {
  // Invariant: The FQDN `name` of the Domain associated with the `node` must exist.
  if (!record.domain.name === null) {
    throw new Error(`Domain 'name' must exists for '${record.registrationLifecycles.node}' node.`);
  }

  // build Registration Lifecycle object
  const registrationLifecycle = {
    subregistry: {
      subregistryId: deserializeAccountId(record.subregistries.subregistryId),
      node: record.subregistries.node,
    },
    node: record.registrationLifecycles.node,
    expiresAt: bigIntToNumber(record.registrationLifecycles.expiresAt),
  } satisfies RegistrationLifecycle;

  // build pricing object
  const { baseCost, premium, total } = record.registrarActions;

  const pricing =
    baseCost !== null && premium !== null && total !== null
      ? ({
          baseCost: priceEth(baseCost),
          premium: priceEth(premium),
          total: priceEth(total),
        } satisfies RegistrarActionPricingAvailable)
      : ({
          baseCost: null,
          premium: null,
          total: null,
        } satisfies RegistrarActionPricingUnknown);

  // build referral object
  const { encodedReferrer, decodedReferrer } = record.registrarActions;
  const referral =
    encodedReferrer !== null && decodedReferrer !== null
      ? ({
          encodedReferrer,
          decodedReferrer,
        } satisfies RegistrarActionReferralAvailable)
      : ({
          encodedReferrer: null,
          decodedReferrer: null,
        } satisfies RegistrarActionReferralNotApplicable);

  // build block ref object
  const block = {
    number: bigIntToNumber(record.registrarActions.blockNumber),

    timestamp: bigIntToNumber(record.registrarActions.timestamp),
  } satisfies BlockRef;

  // build the resulting "logical registrar action"
  const action = {
    id: record.registrarActions.id,
    type: record.registrarActions.type,
    incrementalDuration: bigIntToNumber(record.registrarActions.incrementalDuration),
    registrant: record.registrarActions.registrant,
    registrationLifecycle,
    pricing,
    referral,
    block,
    transactionHash: record.registrarActions.transactionHash,
    eventIds: record.registrarActions.eventIds as [string, ...string[]],
  } satisfies RegistrarAction;

  const name = record.domain.name as InterpretedName;

  return {
    action,
    name,
  };
}

/**
 * Find Registrar Actions, including Domain info
 *
 * @param {SQL} options.orderBy configures which column and order apply to results.
 * @param {number} options.limit configures how many items to include in results.
 */
export async function findRegistrarActions(
  options: FindRegistrarActionsOptions,
): Promise<NamedRegistrarAction[]> {
  const records = await _findRegistrarActions(options);

  return records.map((record) => _mapToNamedRegistrarAction(record));
}
