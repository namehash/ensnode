import { desc, eq, type SQL } from "drizzle-orm/sql";

import * as schema from "@ensnode/ensnode-schema";
import {
  type BlockRef,
  bigIntToNumber,
  deserializeAccountId,
  type InterpretedLabel,
  type InterpretedName,
  priceEth,
  type RegistrarActionPricingAvailable,
  type RegistrarActionPricingUnknown,
  type RegistrarActionReferralAvailable,
  type RegistrarActionReferralNotApplicable,
  type RegistrarActionWithDomain,
  type RegistrationLifecycleWithDomain,
} from "@ensnode/ensnode-sdk";

import { db } from "@/lib/db";

interface FindRegistrarActionsOptions {
  orderBy: SQL;

  limit: number;
}

const findRegistrarActionsDefaultOptions = {
  limit: 25,
  orderBy: desc(schema.registrarActions.timestamp),
} satisfies FindRegistrarActionsOptions;

/**
 * Find Registrar Actions, including Domain info
 *
 * @param {SQL} options.orderBy configures which column and order apply to results.
 * @param {number} options.limit configures how many items to include in results.
 */
export async function findRegistrarActions(
  options: FindRegistrarActionsOptions = findRegistrarActionsDefaultOptions,
): Promise<RegistrarActionWithDomain[]> {
  const {
    orderBy = findRegistrarActionsDefaultOptions.orderBy,
    limit = findRegistrarActionsDefaultOptions.limit,
  } = options;

  const records = await db
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
    .orderBy(orderBy)
    .limit(limit);

  const registrarActions: RegistrarActionWithDomain[] = [];

  for (const record of records) {
    // Invariant: The `label` of the Domain associated with the `node` must exist.
    if (record.domain.labelName === null) {
      throw new Error(
        `Domain 'label' must exists for '${record.registrationLifecycles.node}' node.`,
      );
    }

    // Invariant: The FQDN `name` of the Domain associated with the `node` must exist.
    if (!record.domain.name === null) {
      throw new Error(
        `Domain 'name' must exists for '${record.registrationLifecycles.node}' node.`,
      );
    }

    // build Registration Lifecycle object
    const registrationLifecycle = {
      subregistry: {
        subregistryId: deserializeAccountId(record.subregistries.subregistryId),
        node: record.subregistries.node,
      },
      node: record.registrationLifecycles.node,
      expiresAt: bigIntToNumber(record.registrationLifecycles.expiresAt),
      domain: {
        subname: record.domain.labelName as InterpretedLabel,
        name: record.domain.name as InterpretedName,
      },
    } satisfies RegistrationLifecycleWithDomain;

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

    // build the result referencing the "logical registrar action"
    const registrarAction = {
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
    } satisfies RegistrarActionWithDomain;

    registrarActions.push(registrarAction);
  }

  return registrarActions;
}
