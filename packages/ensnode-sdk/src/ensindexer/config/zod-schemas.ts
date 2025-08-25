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
 * Makes a schema for parsing a list of {@link PluginName} items.
 *
 * The list is guaranteed to include at least one item exists, and no duplicates.
 */
export const makePluginsListSchema = (valueLabel: string = "Plugins") =>
  z
    .array(
      z.enum(PluginName, {
        error: `${valueLabel} must be a list with at least one valid plugin name. Valid plugins are: ${Object.values(
          PluginName,
        ).join(", ")}`,
      }),
    )
    .min(1, {
      error: `${valueLabel} must be a list with at least one valid plugin name. Valid plugins are: ${Object.values(
        PluginName,
      ).join(", ")}`,
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
 * @param directErrorMessages - If true, uses direct error messages instead of valueLabel prefix
 */
export const makeLabelSetIdSchema = (
  valueLabel: string = "Label set ID",
  directErrorMessages: boolean = false,
) => {
  const getError = (field: string, message: string) => {
    if (directErrorMessages) {
      return `LABEL_SET_ID ${message}`;
    }
    return `${valueLabel}.labelSetId ${message}`;
  };

  return z
    .string({ error: getError("labelSetId", "must be a string") })
    .min(1, { error: getError("labelSetId", "must be 1-50 characters long") })
    .max(50, { error: getError("labelSetId", "must be 1-50 characters long") })
    .regex(/^[a-z-]+$/, {
      error: getError("labelSetId", "can only contain lowercase letters (a-z) and hyphens (-)"),
    });
};

/**
 * Makes a schema for parsing a label set version.
 *
 * The label set version is guaranteed to be a non-negative integer.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set version", "LABEL_SET_VERSION")
 * @param directErrorMessages - If true, uses direct error messages instead of valueLabel prefix
 */
export const makeLabelSetVersionSchema = (
  valueLabel: string = "Label set version",
  directErrorMessages: boolean = false,
) => {
  const getError = (field: string, message: string) => {
    if (directErrorMessages) {
      return `LABEL_SET_VERSION ${message}`;
    }
    return `${valueLabel}.labelSetVersion ${message}`;
  };

  return z.coerce
    .number({ error: getError("labelSetVersion", "must be a non-negative integer") })
    .int({ error: getError("labelSetVersion", "must be a non-negative integer") })
    .min(0, { error: getError("labelSetVersion", "must be a non-negative integer") });
};

/**
 * Makes a schema for parsing a label set in universal context.
 *
 * This schema allows for either both fields undefined, or label set ID defined but label set version undefined.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set", "LABEL_SET")
 * @param directErrorMessages - If true, uses direct error messages instead of valueLabel prefix
 */
export const makeLabelSetSchema = (
  valueLabel: string = "Label set",
  directErrorMessages: boolean = false,
) => {
  return z
    .object({
      labelSetId: makeLabelSetIdSchema(valueLabel, directErrorMessages).optional(),
      labelSetVersion: makeLabelSetVersionSchema(valueLabel, directErrorMessages).optional(),
    })
    .refine(
      (data) => {
        // Either both undefined, or labelSetId defined but labelSetVersion undefined
        return (
          (data.labelSetId === undefined && data.labelSetVersion === undefined) ||
          (data.labelSetId !== undefined && data.labelSetVersion === undefined)
        );
      },
      {
        message: `${valueLabel} must have either both fields undefined, or labelSetId defined but labelSetVersion undefined.`,
      },
    );
};

/**
 * Makes a schema for parsing a label set where both label set ID and label set version are required.
 *
 * This schema is what we'll probably be using in this PR, similar to Required<X>.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set", "LABEL_SET")
 * @param directErrorMessages - If true, uses direct error messages instead of valueLabel prefix
 */
export const makeFullyPinnedLabelSetSchema = (
  valueLabel: string = "Label set",
  directErrorMessages: boolean = false,
) => {
  return z.object({
    labelSetId: makeLabelSetIdSchema(valueLabel, directErrorMessages),
    labelSetVersion: makeLabelSetVersionSchema(valueLabel, directErrorMessages),
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

// Invariant: ReverseResolvers plugin requires indexAdditionalResolverRecords
export function invariant_reverseResolversPluginNeedsResolverRecords(
  ctx: ZodCheckFnInput<Pick<ENSIndexerPublicConfig, "plugins" | "indexAdditionalResolverRecords">>,
) {
  const { value: config } = ctx;

  const reverseResolversPluginActive = config.plugins.includes(PluginName.ReverseResolvers);

  if (reverseResolversPluginActive && !config.indexAdditionalResolverRecords) {
    ctx.issues.push({
      code: "custom",
      input: config,
      message: `The '${PluginName.ReverseResolvers}' plugin requires 'indexAdditionalResolverRecords' to be 'true'.`,
    });
  }
}

// Invariant: isSubgraphCompatible requires Subgraph plugin only, no extra indexing features, and subgraph label set
export function invariant_isSubgraphCompatibleRequirements(
  ctx: ZodCheckFnInput<
    Pick<
      ENSIndexerPublicConfig,
      | "plugins"
      | "isSubgraphCompatible"
      | "healReverseAddresses"
      | "indexAdditionalResolverRecords"
      | "labelSet"
    >
  >,
) {
  const { value: config } = ctx;

  if (config.isSubgraphCompatible !== isSubgraphCompatible(config)) {
    const message = config.isSubgraphCompatible
      ? `'isSubgraphCompatible' requires only the '${PluginName.Subgraph}' plugin to be active, both 'indexAdditionalResolverRecords' and 'healReverseAddresses' must be set to 'false', and labelSet must be {labelSetId: "subgraph", labelSetVersion: 0}`
      : `Both 'indexAdditionalResolverRecords' and 'healReverseAddresses' were set to 'false', the only active plugin was the '${PluginName.Subgraph}' plugin, and labelSet was {labelSetId: "subgraph", labelSetVersion: 0}. The 'isSubgraphCompatible' must be set to 'true'`;

    ctx.issues.push({
      code: "custom",
      input: config,
      message,
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
      ensAdminUrl: makeUrlSchema(`${valueLabel}.ensAdminUrl`),
      ensNodePublicUrl: makeUrlSchema(`${valueLabel}.ensNodePublicUrl`),
      labelSet: makeFullyPinnedLabelSetSchema(`${valueLabel}.labelSet`),
      healReverseAddresses: z.boolean({ error: `${valueLabel}.healReverseAddresses` }),
      indexAdditionalResolverRecords: z.boolean({
        error: `${valueLabel}.indexAdditionalResolverRecords`,
      }),
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
    .check(invariant_reverseResolversPluginNeedsResolverRecords)
    .check(invariant_isSubgraphCompatibleRequirements);
