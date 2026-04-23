import { makeEnsDbPublicConfigSchema } from "../../ensdb/zod-schemas/config";
import {
  invariant_ensRainbowCompatibilityWithEnsIndexer,
  makeEnsIndexerStackInfoSchema,
  makeSerializedEnsIndexerStackInfoSchema,
} from "./ensindexer-stack-info";

export function makeSerializedEnsDbStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "EnsDbStackInfo";

  return makeSerializedEnsIndexerStackInfoSchema(label).extend({
    ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
  });
}

export function makeEnsDbStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "EnsDbStackInfo";

  return makeEnsIndexerStackInfoSchema(label)
    .extend({
      ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
    })
    .check(invariant_ensRainbowCompatibilityWithEnsIndexer);
}
