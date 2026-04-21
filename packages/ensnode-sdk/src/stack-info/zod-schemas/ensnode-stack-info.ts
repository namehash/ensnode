import { z } from "zod/v4";

import {
  makeEnsApiPublicConfigSchema,
  makeSerializedEnsApiPublicConfigSchema,
} from "../../ensapi/config/zod-schemas";
import { makeEnsDbPublicConfigSchema } from "../../ensdb/zod-schemas/config";
import {
  makeEnsIndexerPublicConfigSchema,
  makeSerializedEnsIndexerPublicConfigSchema,
} from "../../ensindexer/config/zod-schemas";
import { makeEnsRainbowPublicConfigSchema } from "../../ensrainbow/zod-schemas/config";

export function makeSerializedEnsNodeStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSNodeStackInfo";

  return z.object({
    ensApi: makeSerializedEnsApiPublicConfigSchema(`${label}.ensApi`),
    ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
    ensIndexer: makeSerializedEnsIndexerPublicConfigSchema(`${label}.ensIndexer`),
    ensRainbow: makeEnsRainbowPublicConfigSchema(`${label}.ensRainbow`).optional(),
  });
}

export function makeEnsNodeStackInfoSchema(valueLabel?: string) {
  const label = valueLabel ?? "ENSNodeStackInfo";

  return z.object({
    ensApi: makeEnsApiPublicConfigSchema(`${label}.ensApi`),
    ensDb: makeEnsDbPublicConfigSchema(`${label}.ensDb`),
    ensIndexer: makeEnsIndexerPublicConfigSchema(`${label}.ensIndexer`),
    ensRainbow: makeEnsRainbowPublicConfigSchema(`${label}.ensRainbow`).optional(),
  });
}
