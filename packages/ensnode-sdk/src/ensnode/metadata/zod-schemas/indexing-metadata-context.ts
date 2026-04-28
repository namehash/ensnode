import { z } from "zod/v4";

import {
  makeCrossChainIndexingStatusSnapshotSchema,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "../../../indexing-status/zod-schema/cross-chain-indexing-status-snapshot";
import {
  makeEnsIndexerStackInfoSchema,
  makeSerializedEnsIndexerStackInfoSchema,
} from "../../../stack-info/zod-schemas/ensindexer-stack-info";
import { IndexingMetadataContextStatusCodes } from "../indexing-metadata-context";

const makeSerializedIndexingMetadataContextUninitializedSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "SerializedIndexingMetadataContextUninitialized";

  return z.object({
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Uninitialized, {
      error: `${label} must have status code ${IndexingMetadataContextStatusCodes.Uninitialized}`,
    }),
  });
};

export const makeSerializedIndexingMetadataContextInitializedSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "SerializedIndexingMetadataContextInitialized";

  return z.object({
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Initialized, {
      error: `${label} must have status code ${IndexingMetadataContextStatusCodes.Initialized}`,
    }),
    indexingStatus: makeSerializedCrossChainIndexingStatusSnapshotSchema(`${label}.indexingStatus`),
    stackInfo: makeSerializedEnsIndexerStackInfoSchema(`${label}.stackInfo`),
  });
};

export const makeSerializedIndexingMetadataContextSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "SerializedIndexingMetadataContext";

  return z.discriminatedUnion("statusCode", [
    makeSerializedIndexingMetadataContextUninitializedSchema(label),
    makeSerializedIndexingMetadataContextInitializedSchema(label),
  ]);
};

const makeIndexingMetadataContextUninitializedSchema =
  makeSerializedIndexingMetadataContextUninitializedSchema;

export const makeIndexingMetadataContextInitializedSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "IndexingMetadataContextInitialized";

  return z.object({
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Initialized, {
      error: `${label} must have status code ${IndexingMetadataContextStatusCodes.Initialized}`,
    }),
    indexingStatus: makeCrossChainIndexingStatusSnapshotSchema(`${label}.indexingStatus`),
    stackInfo: makeEnsIndexerStackInfoSchema(`${label}.stackInfo`),
  });
};

export const makeIndexingMetadataContextSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "IndexingMetadataContext";

  return z.discriminatedUnion("statusCode", [
    makeIndexingMetadataContextUninitializedSchema(label),
    makeIndexingMetadataContextInitializedSchema(label),
  ]);
};
