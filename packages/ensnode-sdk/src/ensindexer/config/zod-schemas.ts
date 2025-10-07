/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import z from "zod/v4";
import { uniq } from "../../shared";
import {
  ZodCheckFnInput,
  makeChainIdSchema,
  makeENSNamespaceIdSchema,
  makeNonNegativeIntegerSchema,
  makePositiveIntegerSchema,
  makeUrlSchema,
} from "../../shared/zod-schemas";
import { isSubgraphCompatible } from "./helpers";
import { PluginName } from "./types";
import type { ENSIndexerPublicConfig } from "./types";

/**
 * Makes a schema for parsing {@link IndexedChainIds}.
 */
export const makeIndexedChainIdsSchema = (valueLabel: string = "Indexed Chain IDs") =>
  z
    .array(makeChainIdSchema(valueLabel), {
      error: `${valueLabel} must be an array.`,
    })
    .min(1, { error: `${valueLabel} list must include at least one element.` })
    .transform((v) => new Set(v));

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
export const makeDatabaseSchemaNameSchema = (valueLabel: string = "Database schema name") =>
  z
    .string({ error: `${valueLabel} must be a string` })
    .trim()
    .nonempty({
      error: `${valueLabel} is required and must be a non-empty string.`,
    });

/**
 * Makes a schema for parsing a label set ID.
 *
 * The label set ID is guaranteed to be a string between 1-50 characters
 * containing only lowercase letters (a-z) and hyphens (-).
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set ID", "LABEL_SET_ID")
 */
export const makeLabelSetIdSchema = (valueLabel: string) => {
  return z
    .string({ error: `${valueLabel} must be a string` })
    .min(1, { error: `${valueLabel} must be 1-50 characters long` })
    .max(50, { error: `${valueLabel} must be 1-50 characters long` })
    .regex(/^[a-z-]+$/, {
      error: `${valueLabel} can only contain lowercase letters (a-z) and hyphens (-)`,
    });
};

/**
 * Makes a schema for parsing a label set version.
 *
 * The label set version is guaranteed to be a non-negative integer.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set version", "LABEL_SET_VERSION")

 */
export const makeLabelSetVersionSchema = (valueLabel: string) => {
  return z.coerce
    .number({ error: `${valueLabel} must be an integer.` })
    .pipe(makeNonNegativeIntegerSchema(valueLabel));
};

/**
 * Makes a schema for parsing a label set where both label set ID and label set version are required.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set", "LABEL_SET")
 */
export const makeFullyPinnedLabelSetSchema = (valueLabel: string = "Label set") => {
  let valueLabelLabelSetId = valueLabel;
  let valueLabelLabelSetVersion = valueLabel;
  if (valueLabel == "LABEL_SET") {
    valueLabelLabelSetId = "LABEL_SET_ID";
    valueLabelLabelSetVersion = "LABEL_SET_VERSION";
  } else {
    valueLabelLabelSetId = valueLabel + ".labelSetId";
    valueLabelLabelSetVersion = valueLabel + ".labelSetVersion";
  }
  return z.object({
    labelSetId: makeLabelSetIdSchema(valueLabelLabelSetId),
    labelSetVersion: makeLabelSetVersionSchema(valueLabelLabelSetVersion),
  });
};

const makeNonEmptyStringSchema = (valueLabel: string = "Value") =>
  z.string().nonempty({ error: `${valueLabel} must be a non-empty string.` });

export const makeDependencyInfoSchema = (valueLabel: string = "Value") =>
  z.strictObject(
    {
      nodejs: makeNonEmptyStringSchema(),
      ponder: makeNonEmptyStringSchema(),
      ensRainbow: makeNonEmptyStringSchema(),
      ensRainbowSchema: makePositiveIntegerSchema(),
    },
    {
      error: `${valueLabel} must be a valid DependencyInfo object.`,
    },
  );

// Invariant: If config.isSubgraphCompatible, the config must pass isSubgraphCompatible(config)
export function invariant_isSubgraphCompatibleRequirements(
  ctx: ZodCheckFnInput<
    Pick<ENSIndexerPublicConfig, "plugins" | "isSubgraphCompatible" | "labelSet">
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

/**
 * ENSIndexer Public Config Schema
 *
 * Makes a Zod schema definition for validating all important settings used
 * during runtime of the ENSIndexer instance.
 */
export const makeENSIndexerPublicConfigSchema = (valueLabel: string = "ENSIndexerPublicConfig") =>
  z
    .object({
      labelSet: makeFullyPinnedLabelSetSchema(`${valueLabel}.labelSet`),
      indexedChainIds: makeIndexedChainIdsSchema(`${valueLabel}.indexedChainIds`),
      isSubgraphCompatible: z.boolean({ error: `${valueLabel}.isSubgraphCompatible` }),
      namespace: makeENSNamespaceIdSchema(`${valueLabel}.namespace`),
      plugins: makePluginsListSchema(`${valueLabel}.plugins`),
      databaseSchemaName: makeDatabaseSchemaNameSchema(`${valueLabel}.databaseSchemaName`),
      dependencyInfo: makeDependencyInfoSchema(`${valueLabel}.dependencyInfo`),
    })
    /**
     * Validations
     *
     * All required data validations must be performed below.
     */
    .check(invariant_isSubgraphCompatibleRequirements);
