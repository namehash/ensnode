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

import z from "zod/v4";

import type { ChainIdString, ChainIndexingStatusSnapshot } from "@ensnode/ensnode-sdk";
import {
  makeBlockRefSchema,
  makeChainIdSchema,
  makeChainIdStringSchema,
  makeNonNegativeIntegerSchema,
} from "@ensnode/ensnode-sdk/internal";

import { createChainIndexingSnapshot } from "./chains";

const makeChainIdsSchema = (chainIds: string[]) => z.enum(chainIds);

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

export const makePonderChainMetadataSchema = (chainIds: ChainIdString[]) => {
  const ChainIdsSchema = makeChainIdsSchema(chainIds);

  const invariant_definedEntryForEachIndexedChain = (v: Map<ChainIdString, unknown>) =>
    chainIds.every((chainIds) => Array.from(v.keys()).includes(chainIds));

  return z
    .map(ChainIdsSchema, PonderChainMetadataSchema)
    .refine(invariant_definedEntryForEachIndexedChain, {
      error: "All `chainIds` must be represented by Ponder Chains Block Refs object.",
    })

    .transform((chains) => {
      const serializedChainIndexingStatusSnapshots = {} as Record<
        ChainIdString,
        ChainIndexingStatusSnapshot
      >;

      for (const chainId of chainIds) {
        // biome-ignore lint/style/noNonNullAssertion: guaranteed to exist
        const indexedChain = chains.get(chainId)!;

        serializedChainIndexingStatusSnapshots[indexedChain.chainId] =
          createChainIndexingSnapshot(indexedChain);
      }

      return serializedChainIndexingStatusSnapshots;
    });
};

export const makePonderStatusChainSchema = (valueLabel = "Ponder Status Chain") => {
  const chainIdSchema = makeChainIdSchema(valueLabel);
  const blockRefSchema = makeBlockRefSchema(valueLabel);

  return z.object({
    id: chainIdSchema,
    block: blockRefSchema,
  });
};

export const makePonderStatusResponseSchema = (valueLabel = "Ponder Status Response") =>
  z.record(
    makeChainIdStringSchema(`${valueLabel}.key`),
    makePonderStatusChainSchema(`${valueLabel}.value`),
    {
      error:
        "Ponder Status Response must be an object mapping valid chain ID to a ponder status chain object.",
    },
  );
