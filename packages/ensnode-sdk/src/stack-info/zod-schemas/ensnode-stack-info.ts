import {
  makeEnsApiPublicConfigSchema,
  makeSerializedEnsApiPublicConfigSchema,
} from "../../ensapi/config/zod-schemas";
import type { ZodCheckFnInput } from "../../shared/zod-types";
import type { EnsNodeStackInfo } from "../ensnode-stack-info";
import { makeEnsDbStackInfoSchema, makeSerializedEnsDbStackInfoSchema } from "./ensdb-stack-info";
import { invariant_ensRainbowCompatibilityWithEnsIndexer } from "./ensindexer-stack-info";

function invariant_ensApiCompatibilityWithEnsIndexerAndEnsRainbow(
  ctx: ZodCheckFnInput<EnsNodeStackInfo>,
) {
  const { ensApi, ensIndexer, ensRainbow } = ctx.value;

  // Invariant: ENSApi & ENSDB must match version numbers
  if (ensIndexer.versionInfo.ensDb !== ensApi.versionInfo.ensApi) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexer.versionInfo.ensDb"],
      input: ensIndexer.versionInfo.ensDb,
      message: `Version Mismatch: ENSDB@${ensIndexer.versionInfo.ensDb} !== ENSApi@${ensApi.versionInfo.ensApi}`,
    });
  }

  // Invariant: ENSApi & ENSIndexer must match version numbers
  if (ensIndexer.versionInfo.ensIndexer !== ensApi.versionInfo.ensApi) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexer.versionInfo.ensIndexer"],
      input: ensIndexer.versionInfo.ensIndexer,
      message: `Version Mismatch: ENSIndexer@${ensIndexer.versionInfo.ensIndexer} !== ENSApi@${ensApi.versionInfo.ensApi}`,
    });
  }

  // Invariant: ENSApi & ENSRainbow must match version numbers
  if (ensRainbow.version !== ensApi.versionInfo.ensApi) {
    ctx.issues.push({
      code: "custom",
      path: ["ensRainbow.version"],
      input: ensRainbow.version,
      message: `Version Mismatch: ENSRainbow@${ensRainbow.version} !== ENSApi@${ensApi.versionInfo.ensApi}`,
    });
  }

  // Invariant: `@adraffy/ens-normalize` package version must match between ENSApi & ENSIndexer
  if (ensIndexer.versionInfo.ensNormalize !== ensApi.versionInfo.ensNormalize) {
    ctx.issues.push({
      code: "custom",
      path: ["ensIndexer.versionInfo.ensNormalize"],
      input: ensIndexer.versionInfo.ensNormalize,
      message: `Dependency Version Mismatch: '@adraffy/ens-normalize' version must be the same between ENSIndexer and ENSApi. Found ENSApi@${ensApi.versionInfo.ensNormalize} and ENSIndexer@${ensIndexer.versionInfo.ensNormalize}`,
    });
  }
}

export function makeSerializedEnsNodeStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSNodeStackInfo";

  return makeSerializedEnsDbStackInfoSchema(label).extend({
    ensApi: makeSerializedEnsApiPublicConfigSchema(`${label}.ensApi`),
  });
}

export function makeEnsNodeStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSNodeStackInfo";

  return makeEnsDbStackInfoSchema(label)
    .extend({
      ensApi: makeEnsApiPublicConfigSchema(`${label}.ensApi`),
    })
    .check(invariant_ensApiCompatibilityWithEnsIndexerAndEnsRainbow)
    .check(invariant_ensRainbowCompatibilityWithEnsIndexer);
}
