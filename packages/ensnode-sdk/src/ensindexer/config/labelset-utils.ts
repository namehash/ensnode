import {
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  type LabelSetId,
  type LabelSetVersion,
} from "../../ensrainbow";
import { makeLabelSetIdSchema, makeLabelSetVersionSchema } from "./zod-schemas";

/**
 * Builds a valid LabelSetId from a string.
 * @param maybeLabelSetId - The string to validate and convert to a LabelSetId.
 * @returns A valid LabelSetId.
 * @throws If the input string is not a valid LabelSetId.
 */
export function buildLabelSetId(maybeLabelSetId: string): LabelSetId {
  return makeLabelSetIdSchema("LabelSetId").parse(maybeLabelSetId);
}

/**
 * Builds a valid LabelSetVersion from a number or string.
 * @param maybeLabelSetVersion - The number or string to validate and convert to a LabelSetVersion.
 * @returns A valid LabelSetVersion.
 * @throws If the input is not a valid LabelSetVersion.
 */
export function buildLabelSetVersion(maybeLabelSetVersion: number | string): LabelSetVersion {
  return makeLabelSetVersionSchema("LabelSetVersion").parse(maybeLabelSetVersion);
}

/**
 * Builds an EnsRainbowClientLabelSet.
 * @param labelSetId - The label set ID.
 * @param labelSetVersion - The label set version.
 * @returns A valid EnsRainbowClientLabelSet object.
 * @throws If `labelSetVersion` is defined without `labelSetId`.
 */
export function buildEnsRainbowClientLabelSet(
  labelSetId?: LabelSetId,
  labelSetVersion?: LabelSetVersion,
): EnsRainbowClientLabelSet {
  if (labelSetVersion !== undefined && labelSetId === undefined) {
    throw new Error("When a labelSetVersion is defined, labelSetId must also be defined.");
  }

  return { labelSetId, labelSetVersion };
}

/**
 * Validates that the server's label set is compatible with the client's requested label set.
 * @param serverSet - The label set provided by the server.
 * @param clientSet - The label set requested by the client.
 * @throws If the server set is not compatible with the client set.
 */
export function validateSupportedLabelSetAndVersion(
  serverSet: EnsRainbowServerLabelSet,
  clientSet: EnsRainbowClientLabelSet,
): void {
  if (clientSet.labelSetId === undefined) {
    // Client did not specify a label set, so any server set is acceptable.
    return;
  }

  if (serverSet.labelSetId !== clientSet.labelSetId) {
    throw new Error(
      `Server label set ID "${serverSet.labelSetId}" does not match client's requested label set ID "${clientSet.labelSetId}".`,
    );
  }

  if (
    clientSet.labelSetVersion !== undefined &&
    serverSet.highestLabelSetVersion < clientSet.labelSetVersion
  ) {
    throw new Error(
      `Server highest label set version ${serverSet.highestLabelSetVersion} is less than client's requested version ${clientSet.labelSetVersion} for label set ID "${clientSet.labelSetId}".`,
    );
  }
}
