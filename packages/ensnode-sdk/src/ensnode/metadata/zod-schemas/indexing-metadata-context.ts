import { z } from "zod/v4";

import {
  makeCrossChainIndexingStatusSnapshotSchema,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "../../../indexing-status/zod-schema/cross-chain-indexing-status-snapshot";
import {
  makeEnsNodeStackInfoSchema,
  makeSerializedEnsNodeStackInfoSchema,
} from "../../../stack-info/zod-schemas/ensnode-stack-info";
import { IndexingMetadataContextStatusCodes } from "../indexing-metadata-context";

const makeSerializedIndexingMetadataContextUninitializedSchema = (_valueLabel?: string) => {
  return z.object({
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Uninitialized),
  });
};

export const makeSerializedIndexingMetadataContextInitializedSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "SerializedIndexingMetadataContextInitialized";

  return z.object({
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Initialized),
    indexingStatus: makeSerializedCrossChainIndexingStatusSnapshotSchema(`${label}.indexingStatus`),
    stackInfo: makeSerializedEnsNodeStackInfoSchema(`${label}.stackInfo`),
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
    statusCode: z.literal(IndexingMetadataContextStatusCodes.Initialized),
    indexingStatus: makeCrossChainIndexingStatusSnapshotSchema(`${label}.indexingStatus`),
    stackInfo: makeEnsNodeStackInfoSchema(`${label}.stackInfo`),
  });
};

export const makeIndexingMetadataContextSchema = (valueLabel?: string) => {
  const label = valueLabel ?? "IndexingMetadataContext";

  return z.discriminatedUnion("statusCode", [
    makeIndexingMetadataContextUninitializedSchema(label),
    makeIndexingMetadataContextInitializedSchema(label),
  ]);
};
