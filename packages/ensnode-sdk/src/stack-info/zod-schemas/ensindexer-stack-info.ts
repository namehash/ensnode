import { z } from "zod/v4";

import { makeEnsDbPublicConfigSchema } from "../../ensdb/zod-schemas/config";
import {
  makeEnsIndexerPublicConfigSchema,
  makeSerializedEnsIndexerPublicConfigSchema,
} from "../../ensindexer/config/zod-schemas";
import { makeEnsRainbowPublicConfigSchema } from "../../ensrainbow/zod-schemas/config";
import type { ZodCheckFnInput } from "../../shared/zod-types";
import type { EnsIndexerStackInfo } from "../ensindexer-stack-info";

export function makeSerializedEnsIndexerStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSIndexerStackInfo";

  return z.object({
    ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
    ensIndexer: makeSerializedEnsIndexerPublicConfigSchema(`${label}.ensIndexer`),
    ensRainbow: makeEnsRainbowPublicConfigSchema(`${label}.ensRainbow`),
  });
}

export function invariant_ensRainbowCompatibilityWithEnsIndexer(
  ctx: ZodCheckFnInput<EnsIndexerStackInfo>,
) {
  const { ensIndexer, ensRainbow } = ctx.value;

  if (ensIndexer.clientLabelSet.labelSetId !== ensRainbow.labelSet.labelSetId) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `ENSRainbow's label set (id: ${ensRainbow.labelSet.labelSetId}) must be the same as the ENSIndexer's label set (id: ${ensIndexer.clientLabelSet.labelSetId}).`,
    });
  }

  if (ensIndexer.clientLabelSet.labelSetVersion > ensRainbow.labelSet.highestLabelSetVersion) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `ENSRainbow's server label set version (highest: ${ensRainbow.labelSet.highestLabelSetVersion}) must be greater than or equal to ENSIndexer's client label set version (current: ${ensIndexer.clientLabelSet.labelSetVersion}).`,
    });
  }
}

export function makeEnsIndexerStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSIndexerStackInfo";

  return z
    .object({
      ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
      ensIndexer: makeEnsIndexerPublicConfigSchema(`${label}.ensIndexer`),
      ensRainbow: makeEnsRainbowPublicConfigSchema(`${label}.ensRainbow`),
    })
    .check(invariant_ensRainbowCompatibilityWithEnsIndexer);
}
