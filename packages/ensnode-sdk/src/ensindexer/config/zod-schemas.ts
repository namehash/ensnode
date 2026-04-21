/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import { z } from "zod/v4";

import type { EnsRainbowClientLabelSet, EnsRainbowServerLabelSet } from "../../ensrainbow/types";
import {
  makeEnsRainbowPublicConfigSchema,
  makeLabelSetIdSchema,
  makeLabelSetVersionStringSchema,
} from "../../ensrainbow/zod-schemas/config";
import { uniq } from "../../shared/collections";
import { makeChainIdSchema, makeENSNamespaceIdSchema } from "../../shared/zod-schemas";
import type { ZodCheckFnInput } from "../../shared/zod-types";
import { isSubgraphCompatible } from "./is-subgraph-compatible";
import { validateSupportedLabelSetAndVersion } from "./labelset-utils";
import type { EnsIndexerPublicConfig } from "./types";
import { PluginName } from "./types";
import { invariant_ensDbVersionIsSameAsEnsIndexerVersion } from "./validations";

/**
 * Makes a schema for parsing {@link IndexedChainIds}.
 */
export const makeIndexedChainIdsSchema = (valueLabel: string = "Indexed Chain IDs") =>
  z.set(makeChainIdSchema(valueLabel), { error: `${valueLabel} must be a set` }).min(1, {
    error: `${valueLabel} must be a set with at least one chain ID.`,
  });

export const makeSerializedIndexedChainIdsSchema = (valueLabel: string = "Indexed Chain IDs") =>
  z
    .array(makeChainIdSchema(valueLabel), {
      error: `${valueLabel} must be an array.`,
    })
    .min(1, {
      error: `${valueLabel} must be an array with at least one chain ID.`,
    });

/**
 * Makes a schema for parsing a list of strings that (for future-proofing)
 * may or may not be current {@link PluginName} values.
 *
 * The list is guaranteed to include at least one string and no duplicates.
 */
export const makePluginsListSchema = (valueLabel: string = "Plugins") =>
  z
    .array(z.string(), {
      error: `${valueLabel} must be a list of strings.`,
    })
    .min(1, {
      error: `${valueLabel} must be a list of strings with at least one string value`,
    })
    .refine((arr) => arr.length === uniq(arr).length, {
      error: `${valueLabel} cannot contain duplicate values.`,
    });

/**
 * Makes a schema for parsing a name for a database schema.
 *
 * The name is guaranteed to be a non-empty string.
 */
export const makeEnsIndexerSchemaNameSchema = (valueLabel: string = "ENS Indexer Schema Name") =>
  z
    .string({ error: `${valueLabel} must be a string` })
    .trim()
    .nonempty({
      error: `${valueLabel} is required and must be a non-empty string.`,
    });

/**
 * Makes a schema for parsing a label set where both label set ID and label set version are required.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set", "LABEL_SET")
 */
export const makeFullyPinnedLabelSetSchema = (valueLabel: string = "Label set") => {
  let valueLabelLabelSetId = valueLabel;
  let valueLabelLabelSetVersion = valueLabel;
  if (valueLabel === "LABEL_SET") {
    valueLabelLabelSetId = "LABEL_SET_ID";
    valueLabelLabelSetVersion = "LABEL_SET_VERSION";
  } else {
    valueLabelLabelSetId = `${valueLabel}.labelSetId`;
    valueLabelLabelSetVersion = `${valueLabel}.labelSetVersion`;
  }
  return z.object({
    labelSetId: makeLabelSetIdSchema(valueLabelLabelSetId),
    labelSetVersion: makeLabelSetVersionStringSchema(valueLabelLabelSetVersion),
  });
};

const makeNonEmptyStringSchema = (valueLabel: string = "Value") =>
  z.string().nonempty({ error: `${valueLabel} must be a non-empty string.` });

export const makeEnsIndexerVersionInfoSchema = (valueLabel: string = "Value") =>
  z
    .object(
      {
        ponder: makeNonEmptyStringSchema(),
        ensDb: makeNonEmptyStringSchema(),
        ensIndexer: makeNonEmptyStringSchema(),
        ensNormalize: makeNonEmptyStringSchema(),
      },
      {
        error: `${valueLabel} must be a valid ENSIndexerVersionInfo object.`,
      },
    )
    .check(invariant_ensDbVersionIsSameAsEnsIndexerVersion);

/**
 * @deprecated Use {@link makeEnsIndexerVersionInfoSchema} instead.
 */
export const makeENSIndexerVersionInfoSchema = makeEnsIndexerVersionInfoSchema;

// Invariant: If config.isSubgraphCompatible, the config must pass isSubgraphCompatible(config)
export function invariant_isSubgraphCompatibleRequirements(
  ctx: ZodCheckFnInput<
    Pick<EnsIndexerPublicConfig, "namespace" | "plugins" | "isSubgraphCompatible" | "labelSet">
  >,
) {
  const { value: config } = ctx;

  if (config.isSubgraphCompatible && !isSubgraphCompatible(config)) {
    ctx.issues.push({
      code: "custom",
      input: config,
      message: `'isSubgraphCompatible' requires only the '${PluginName.Subgraph}' plugin to be active and labelSet must be {labelSetId: "subgraph", labelSetVersion: 0}`,
    });
  }
}

export function invariant_ensRainbowSupportedLabelSetAndVersion(
  ctx: ZodCheckFnInput<Pick<EnsIndexerPublicConfig, "labelSet" | "ensRainbowPublicConfig">>,
) {
  const clientLabelSet = ctx.value.labelSet satisfies EnsRainbowClientLabelSet;
  const serverLabelSet = ctx.value.ensRainbowPublicConfig
    .labelSet satisfies EnsRainbowServerLabelSet;

  try {
    validateSupportedLabelSetAndVersion(serverLabelSet, clientLabelSet);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `The ENSRainbow label set and version specified in the config are not supported by the ENSRainbow version specified in ensRainbowPublicConfig. Cause: ${errorMessage}`,
    });
  }
}

/**
 * ENSIndexer Public Config Schema
 *
 * Makes a Zod schema definition for validating all important settings used
 * during runtime of the ENSIndexer instance.
 */
export const makeEnsIndexerPublicConfigSchema = (valueLabel: string = "ENSIndexerPublicConfig") =>
  z
    .object({
      ensIndexerSchemaName: makeEnsIndexerSchemaNameSchema(`${valueLabel}.ensIndexerSchemaName`),
      ensRainbowPublicConfig: makeEnsRainbowPublicConfigSchema(
        `${valueLabel}.ensRainbowPublicConfig`,
      ),
      indexedChainIds: makeIndexedChainIdsSchema(`${valueLabel}.indexedChainIds`),
      isSubgraphCompatible: z.boolean({
        error: `${valueLabel}.isSubgraphCompatible must be a boolean value.`,
      }),
      labelSet: makeFullyPinnedLabelSetSchema(`${valueLabel}.labelSet`),
      namespace: makeENSNamespaceIdSchema(`${valueLabel}.namespace`),
      plugins: makePluginsListSchema(`${valueLabel}.plugins`),
      versionInfo: makeEnsIndexerVersionInfoSchema(`${valueLabel}.versionInfo`),
    })
    /**
     * Validations
     *
     * All required data validations must be performed below.
     */
    .check(invariant_isSubgraphCompatibleRequirements)
    .check(invariant_ensRainbowSupportedLabelSetAndVersion);

/**
 * ENSIndexer Public Config Schema
 *
 * @deprecated Use {@link makeEnsIndexerPublicConfigSchema} instead.
 */
export const makeENSIndexerPublicConfigSchema = makeEnsIndexerPublicConfigSchema;

export const makeSerializedEnsIndexerPublicConfigSchema = (
  valueLabel: string = "Serialized ENSIndexerPublicConfig",
) =>
  z.object({
    ensIndexerSchemaName: makeEnsIndexerSchemaNameSchema(`${valueLabel}.ensIndexerSchemaName`),
    ensRainbowPublicConfig: makeEnsRainbowPublicConfigSchema(
      `${valueLabel}.ensRainbowPublicConfig`,
    ),
    indexedChainIds: makeSerializedIndexedChainIdsSchema(`${valueLabel}.indexedChainIds`),
    isSubgraphCompatible: z.boolean({
      error: `${valueLabel}.isSubgraphCompatible must be a boolean value.`,
    }),
    labelSet: makeFullyPinnedLabelSetSchema(`${valueLabel}.labelSet`),
    namespace: makeENSNamespaceIdSchema(`${valueLabel}.namespace`),
    plugins: makePluginsListSchema(`${valueLabel}.plugins`),
    versionInfo: makeEnsIndexerVersionInfoSchema(`${valueLabel}.versionInfo`),
  });
