import { z } from "zod/v4";

import { makeNonNegativeIntegerSchema } from "../../shared/zod-schemas";

/**
 * Makes a schema for parsing a label set ID.
 *
 * The label set ID is guaranteed to be a string between 1-50 characters
 * containing only lowercase letters (a-z) and hyphens (-).
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set ID", "LABEL_SET_ID")
 */
export const makeLabelSetIdSchema = (valueLabel: string = "Label set ID") => {
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
export const makeLabelSetVersionSchema = (valueLabel: string = "Label set version") =>
  makeNonNegativeIntegerSchema(valueLabel);

/**
 * Makes a schema for parsing a label set version string.
 *
 * @param valueLabel - The label to use in error messages (e.g., "Label set version", "LABEL_SET_VERSION")
 */
export const makeLabelSetVersionStringSchema = (valueLabel: string = "Label set version") =>
  z.coerce
    .number<number>({ error: `${valueLabel} must be a non-negative integer` })
    .pipe(makeLabelSetVersionSchema(valueLabel));

/**
 * Makes a schema for parsing the EnsRainbowPublicConfig object.
 */
export const makeEnsRainbowPublicConfigSchema = (valueLabel: string = "EnsRainbowPublicConfig") =>
  z.object({
    version: z.string().nonempty({ error: `${valueLabel}.version must be a non-empty string.` }),
    labelSet: z.object({
      labelSetId: makeLabelSetIdSchema(`${valueLabel}.labelSet.labelSetId`),
      highestLabelSetVersion: makeLabelSetVersionSchema(
        `${valueLabel}.labelSet.highestLabelSetVersion`,
      ),
    }),
    recordsCount: makeNonNegativeIntegerSchema(`${valueLabel}.recordsCount`),
  });
