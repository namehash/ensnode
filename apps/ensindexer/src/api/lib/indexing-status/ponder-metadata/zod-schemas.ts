/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 *
 * This file defines Zod schemas required to validate data coming from
 * Ponder metrics and Ponder status endpoints and make this data fit
 * into the ENSIndexer application data model (and its constraints).
 */
import {
  type ChainIdString,
  ChainIndexingCompletedStatus,
  ChainIndexingQueuedStatus,
  type ChainIndexingStatus,
  ChainIndexingStatusForBackfillOverallStatus,
  ChainIndexingStatusIds,
  OverallIndexingStatusIds,
  SerializedENSIndexerOverallIndexingBackfillStatus,
  SerializedENSIndexerOverallIndexingCompletedStatus,
  SerializedENSIndexerOverallIndexingFollowingStatus,
  SerializedENSIndexerOverallIndexingUnstartedStatus,
  UnixTimestamp,
  checkChainIndexingStatusesForBackfillOverallStatus,
  checkChainIndexingStatusesForCompletedOverallStatus,
  checkChainIndexingStatusesForFollowingOverallStatus,
  checkChainIndexingStatusesForUnstartedOverallStatus,
  getOmnichainIndexingCursor,
  getOverallApproxRealtimeDistance,
  getOverallIndexingStatus,
} from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeDurationSchema,
  makeNonNegativeIntegerSchema,
} from "@ensnode/ensnode-sdk/internal";
import z from "zod/v4";

import { getChainIndexingStatus } from "./chains";
import type { ChainName } from "./config";

const makeChainNameSchema = (indexedChainNames: string[]) => z.enum(indexedChainNames);

const PonderBlockRefSchema = makeBlockRefSchema();

const PonderCommandSchema = z.enum(["dev", "start"]);

const PonderOrderingSchema = z.literal("omnichain");

export const PonderAppSettingsSchema = z.strictObject({
  command: PonderCommandSchema,
  ordering: PonderOrderingSchema,
});

const PonderMetricBooleanSchema = z.coerce.string().transform((v) => v === "1");

const PonderChainMetadataSchema = z.strictObject({
  chainId: makeChainIdSchema(),
  config: z.object({
    startBlock: PonderBlockRefSchema,
    endBlock: PonderBlockRefSchema.nullable(),
  }),
  backfillEndBlock: PonderBlockRefSchema,
  historicalTotalBlocks: makeNonNegativeIntegerSchema(),
  isSyncComplete: PonderMetricBooleanSchema,
  isSyncRealtime: PonderMetricBooleanSchema,
  syncBlock: PonderBlockRefSchema,
  statusBlock: PonderBlockRefSchema,
});

export const makePonderChainMetadataSchema = (
  indexedChainNames: string[],
  systemTimestamp: UnixTimestamp,
) => {
  const ChainNameSchema = makeChainNameSchema(indexedChainNames);

  const invariant_definedEntryForEachIndexedChain = (v: Map<ChainName, unknown>) =>
    indexedChainNames.every((chainName) => Array.from(v.keys()).includes(chainName));

  return z
    .object({
      appSettings: PonderAppSettingsSchema,

      chains: z
        .map(ChainNameSchema, PonderChainMetadataSchema)
        .refine(invariant_definedEntryForEachIndexedChain, {
          error: "All `indexedChainNames` must be represented by Ponder Chains Block Refs object.",
        }),

      maxRealtimeDistance: makeDurationSchema().optional(),
    })
    .transform((ponderIndexingStatus) => {
      let serializedChainIndexingStatuses = {} as Record<ChainIdString, ChainIndexingStatus>;

      for (const chainName of indexedChainNames) {
        const indexedChain = ponderIndexingStatus.chains.get(chainName)!;

        serializedChainIndexingStatuses[indexedChain.chainId] = getChainIndexingStatus(
          indexedChain,
          systemTimestamp,
        );
      }

      const chainStatuses = Object.values(serializedChainIndexingStatuses);
      const overallStatus = getOverallIndexingStatus(chainStatuses);
      const requestedMaxRealtimeDistance = ponderIndexingStatus.maxRealtimeDistance;

      switch (overallStatus) {
        case OverallIndexingStatusIds.Unstarted: {
          return {
            overallStatus: OverallIndexingStatusIds.Unstarted,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingQueuedStatus
            >, // forcing the type here, will be validated in the following 'check' step
            maxRealtimeDistance: requestedMaxRealtimeDistance
              ? {
                  requestedDistance: requestedMaxRealtimeDistance,
                  satisfiesRequestedDistance: false,
                }
              : undefined,
          } satisfies SerializedENSIndexerOverallIndexingUnstartedStatus;
        }

        case OverallIndexingStatusIds.Backfill: {
          return {
            overallStatus: OverallIndexingStatusIds.Backfill,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingStatusForBackfillOverallStatus
            >, // forcing the type here, will be validated in the following 'check' step
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            maxRealtimeDistance: requestedMaxRealtimeDistance
              ? {
                  requestedDistance: requestedMaxRealtimeDistance,
                  satisfiesRequestedDistance: false,
                }
              : undefined,
          } satisfies SerializedENSIndexerOverallIndexingBackfillStatus;
        }

        case OverallIndexingStatusIds.Completed: {
          return {
            overallStatus: OverallIndexingStatusIds.Completed,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingCompletedStatus
            >, // forcing the type here, will be validated in the following 'check' step
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            maxRealtimeDistance: requestedMaxRealtimeDistance
              ? {
                  requestedDistance: requestedMaxRealtimeDistance,
                  satisfiesRequestedDistance: false,
                }
              : undefined,
          } satisfies SerializedENSIndexerOverallIndexingCompletedStatus;
        }

        case OverallIndexingStatusIds.Following:
          const overallApproxRealtimeDistance = getOverallApproxRealtimeDistance(chainStatuses);

          return {
            overallStatus: OverallIndexingStatusIds.Following,
            chains: serializedChainIndexingStatuses,
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            overallApproxRealtimeDistance,
            maxRealtimeDistance: requestedMaxRealtimeDistance
              ? {
                  requestedDistance: requestedMaxRealtimeDistance,
                  satisfiesRequestedDistance:
                    overallApproxRealtimeDistance <= requestedMaxRealtimeDistance,
                }
              : undefined,
          } satisfies SerializedENSIndexerOverallIndexingFollowingStatus;
      }
    })
    .check((ctx) => {
      const { chains, overallStatus } = ctx.value;
      const chainStatuses = Object.values(chains);
      let hasValidChains = false;

      switch (overallStatus) {
        case OverallIndexingStatusIds.Unstarted:
          hasValidChains = checkChainIndexingStatusesForUnstartedOverallStatus(chainStatuses);
          break;

        case OverallIndexingStatusIds.Backfill:
          hasValidChains = checkChainIndexingStatusesForBackfillOverallStatus(chainStatuses);
          break;

        case OverallIndexingStatusIds.Completed:
          hasValidChains = checkChainIndexingStatusesForCompletedOverallStatus(chainStatuses);
          break;

        case OverallIndexingStatusIds.Following:
          hasValidChains = checkChainIndexingStatusesForFollowingOverallStatus(chainStatuses);
          break;
      }

      if (!hasValidChains) {
        ctx.issues.push({
          code: "custom",
          input: { chains, overallStatus },
          message:
            "Ponder Metadata includes 'chains' object misconfigured for selected 'overallStatus'",
        });
      }
    });
};

export const makePonderStatusSchema = (valueLabel?: "Value") => {
  const chainIdSchema = makeChainIdSchema(valueLabel);
  const blockRefSchema = makeBlockRefSchema(valueLabel);

  return z.record(
    z.string().transform(Number).pipe(chainIdSchema),
    z.object({
      id: chainIdSchema,
      block: blockRefSchema,
    }),
    {
      error: "Ponder Status must be an object mapping valid chain name to a chain status object.",
    },
  );
};
