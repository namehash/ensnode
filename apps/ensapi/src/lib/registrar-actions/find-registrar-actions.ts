import { desc, eq, type SQL } from "drizzle-orm/sql";

import {
  registrarActions,
  registrationLifecycles,
  subgraph_domain,
  subregistries,
} from "@ensnode/ensnode-schema";
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

const DEFAULT_REGISTRAR_ACTIONS_LIMIT = 200;

const DEFAULT_REGISTRAR_ACTIONS_ORDER_BY = desc(registrarActions.timestamp);

/**
 * Find Registrar Actions including Domain info.
 *
 * @param {SQL} orderBy configures which column and order apply to results.
 * @param {number} limit configures how many items to include in results.
 */
export async function findRegistrarActions(
  orderBy: SQL = DEFAULT_REGISTRAR_ACTIONS_ORDER_BY,
  limit: number = DEFAULT_REGISTRAR_ACTIONS_LIMIT,
): Promise<RegistrarActionWithDomain[]> {
  const records = await db
    .select({
      registrarActions,
      registrationLifecycles,
      subregistries,
      domain: {
        labelName: subgraph_domain.labelName,
        name: subgraph_domain.name,
      },
    })
    .from(registrarActions)
    .innerJoin(registrationLifecycles, eq(registrarActions.node, registrationLifecycles.node))
    .innerJoin(subregistries, eq(registrationLifecycles.subregistryId, subregistries.subregistryId))
    .innerJoin(subgraph_domain, eq(registrarActions.node, subgraph_domain.id))
    .orderBy(orderBy)
    .limit(limit);

  return records.map((record) => {
    // Invariant: The `label` of the Domain associated with the `node` must exist.
    if (record.domain.labelName === null) {
      throw new Error(`Domain 'label' must exists for '${record.registrarActions.node}' node.`);
    }

    // Invariant: The FQDN `name` of the Domain associated with the `node` must exist.
    if (!record.domain.name === null) {
      throw new Error(`Domain 'name' must exists for '${record.registrarActions.node}' node.`);
    }

    // build Registration Lifecycle object, including Domain details
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
    // including Domain details at `registrationLifecycle.domain`
    return {
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
  });
}
