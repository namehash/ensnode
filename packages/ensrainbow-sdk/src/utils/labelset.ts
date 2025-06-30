import { parseNonNegativeInteger } from "./parsing";

/**
 * A label set ID identifies a set of labels that can be used for deterministic healing.
 * A label set allows clients to deterministically heal their state against a server,
 * ensuring that both are operating on the same version of data.
 *
 * It is guaranteed to be 1 to 50 characters long and contain only lowercase letters (a-z)
 * and hyphens (-).
 */
export type LabelSetId = string;

/**
 * Builds a valid LabelSetId from a string.
 * @param maybeLabelSetId - The string to validate and convert to a LabelSetId.
 * @returns A valid LabelSetId.
 * @throws If the input string is not a valid LabelSetId.
 */
export function buildLabelSetId(maybeLabelSetId: string): LabelSetId {
  if (maybeLabelSetId.length < 1 || maybeLabelSetId.length > 50) {
    throw new Error("LabelSetId must be between 1 and 50 characters long.");
  }
  if (!/^[a-z-]+$/.test(maybeLabelSetId)) {
    throw new Error(
      `LabelSetId can only contain lowercase letters (a-z) and hyphens (-). LabelSetId: ${maybeLabelSetId}`,
    );
  }
  return maybeLabelSetId;
}

/**
 * A label set version identifies a specific version of a label set. It allows clients to
 * request data from a specific snapshot in time, ensuring deterministic results.
 *
 * It is guaranteed to be a non-negative integer.
 */
export type LabelSetVersion = number;

/**
 * Builds a valid LabelSetVersion from a number or string.
 * @param maybeLabelSetVersion - The number or string to validate and convert to a LabelSetVersion.
 * @returns A valid LabelSetVersion.
 * @throws If the input is not a valid LabelSetVersion.
 */
export function buildLabelSetVersion(maybeLabelSetVersion: number | string): LabelSetVersion {
  let versionNumber: number;
  if (typeof maybeLabelSetVersion === "string") {
    try {
      versionNumber = parseNonNegativeInteger(maybeLabelSetVersion);
    } catch (error) {
      throw new Error(
        `Invalid label set version: ${maybeLabelSetVersion}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  } else {
    if (maybeLabelSetVersion < 0 || !Number.isInteger(maybeLabelSetVersion)) {
      throw new Error(`LabelSetVersion must be a non-negative integer.`);
    }
    versionNumber = maybeLabelSetVersion;
  }

  return versionNumber;
}

/**
 * The state of label sets managed by an ENSRainbow server.
 */
export interface EnsRainbowServerLabelSet {
  labelSetId: LabelSetId;
  highestLabelSetVersion: LabelSetVersion;
}

/**
 * The label set preferences of an ENSRainbow client.
 */
export interface EnsRainbowClientLabelSet {
  /**
   * Optional label set ID that the ENSRainbow server is expected to use. If provided, heal
   * operations will validate the ENSRainbow server is using this labelSetId.
   * Required if `labelSetVersion` is defined.
   */
  labelSetId?: LabelSetId;

  /**
   * Optional highest label set version of label set id to query. Enables deterministic heal
   * results across time even if the ENSRainbow server ingests additional label set versions
   * greater than this value. If provided, only labels from label set versions less than or
   * equal to this value will be returned. If not provided, the server will use the latest
   * available version.
   * When `labelSetVersion` is defined, `labelSetId` must also be defined.
   */
  labelSetVersion?: LabelSetVersion;
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
