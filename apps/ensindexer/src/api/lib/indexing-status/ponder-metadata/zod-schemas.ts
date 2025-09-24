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
  type ChainIndexingSnapshot,
  ChainIndexingSnapshotCompleted,
  ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill,
  ChainIndexingSnapshotQueued,
  OmnichainIndexingStatusIds,
  SerializedOmnichainIndexingSnapshotBackfill,
  SerializedOmnichainIndexingSnapshotCompleted,
  SerializedOmnichainIndexingSnapshotFollowing,
  SerializedOmnichainIndexingSnapshotUnstarted,
  checkChainIndexingStatusesForOmnichainStatusBackfill,
  checkChainIndexingStatusesForOmnichainStatusCompleted,
  checkChainIndexingStatusesForOmnichainStatusFollowing,
  checkChainIndexingStatusesForOmnichainStatusUnstarted,
  getOmnichainIndexingCursor,
  getOmnichainIndexingStatus,
} from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeNonNegativeIntegerSchema,
  makeUnixTimestampSchema,
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

export const makePonderChainMetadataSchema = (indexedChainNames: string[]) => {
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

      systemTime: makeUnixTimestampSchema(),
    })
    .transform(({ chains, systemTime }) => {
      let serializedChainIndexingStatuses = {} as Record<ChainIdString, ChainIndexingSnapshot>;

      for (const chainName of indexedChainNames) {
        const indexedChain = chains.get(chainName)!;

        serializedChainIndexingStatuses[indexedChain.chainId] =
          getChainIndexingStatus(indexedChain);
      }

      const chainStatuses = Object.values(serializedChainIndexingStatuses);
      const omnichainStatus = getOmnichainIndexingStatus(chainStatuses);
      const snapshotTime = systemTime;

      switch (omnichainStatus) {
        case OmnichainIndexingStatusIds.Unstarted: {
          return {
            omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingSnapshotQueued
            >, // forcing the type here, will be validated in the following 'check' step
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            snapshotTime,
          } satisfies SerializedOmnichainIndexingSnapshotUnstarted;
        }

        case OmnichainIndexingStatusIds.Backfill: {
          return {
            omnichainStatus: OmnichainIndexingStatusIds.Backfill,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingSnapshotForOmnichainIndexingSnapshotBackfill
            >, // forcing the type here, will be validated in the following 'check' step
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            snapshotTime,
          } satisfies SerializedOmnichainIndexingSnapshotBackfill;
        }

        case OmnichainIndexingStatusIds.Completed: {
          return {
            omnichainStatus: OmnichainIndexingStatusIds.Completed,
            chains: serializedChainIndexingStatuses as Record<
              ChainIdString,
              ChainIndexingSnapshotCompleted
            >, // forcing the type here, will be validated in the following 'check' step
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            snapshotTime,
          } satisfies SerializedOmnichainIndexingSnapshotCompleted;
        }

        case OmnichainIndexingStatusIds.Following:
          return {
            omnichainStatus: OmnichainIndexingStatusIds.Following,
            chains: serializedChainIndexingStatuses,
            omnichainIndexingCursor: getOmnichainIndexingCursor(chainStatuses),
            snapshotTime,
          } satisfies SerializedOmnichainIndexingSnapshotFollowing;
      }
    })
    .check((ctx) => {
      const { chains, omnichainStatus } = ctx.value;
      const chainStatuses = Object.values(chains);
      let hasValidChains = false;

      switch (omnichainStatus) {
        case OmnichainIndexingStatusIds.Unstarted:
          hasValidChains = checkChainIndexingStatusesForOmnichainStatusUnstarted(chainStatuses);
          break;

        case OmnichainIndexingStatusIds.Backfill:
          hasValidChains = checkChainIndexingStatusesForOmnichainStatusBackfill(chainStatuses);
          break;

        case OmnichainIndexingStatusIds.Completed:
          hasValidChains = checkChainIndexingStatusesForOmnichainStatusCompleted(chainStatuses);
          break;

        case OmnichainIndexingStatusIds.Following:
          hasValidChains = checkChainIndexingStatusesForOmnichainStatusFollowing(chainStatuses);
          break;
      }

      if (!hasValidChains) {
        ctx.issues.push({
          code: "custom",
          input: { chains, omnichainStatus },
          message:
            "Ponder Metadata includes 'chains' object misconfigured for selected 'omnichainStatus'",
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
