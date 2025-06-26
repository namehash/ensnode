/**
 * Represents the label set information provided by an ENSRainbow server.
 */
export interface EnsRainbowServerLabelSet {
  labelSetId: string;
  highestLabelSetVersion: number;
}

/**
 * Represents the label set preferences of an ENSRainbow client.
 */
export interface EnsRainbowClientLabelSet {
  /**
   * Optional label set ID that the ENSRainbow server is expected to use. If provided, heal operations will validate the ENSRainbow server is using this labelSetId.
   * If provided without `labelSetVersion`, the server will use the latest available version.
   * Required if `labelSetVersion` is defined.
   */
  labelSetId?: string;

  /**
   * Optional highest label set version to accept. If provided, only labels from sets less than or equal to this value will be returned.
   * When `labelSetVersion` is provided, `labelSetId` must also be provided.
   */
  labelSetVersion?: number;
}

/**
 * Builds a validated EnsRainbowClientLabelSet object.
 * @param labelSetId - The label set ID.
 * @param labelSetVersion - The label set version.
 * @returns A valid EnsRainbowClientLabelSet object.
 * @throws If `labelSetVersion` is provided without `labelSetId`.
 */
export function buildEnsRainbowClientLabelSet(
  labelSetId?: string,
  labelSetVersion?: number,
): EnsRainbowClientLabelSet {
  if (labelSetVersion !== undefined && labelSetId === undefined) {
    throw new Error("When a labelSetVersion is provided, labelSetId must also be provided.");
  }

  return { labelSetId, labelSetVersion };
}

/**
 * Validates that the server's label set is compatible with the client's requested label set.
 * @param serverSet - The label set provided by the server.
 * @param clientSet - The label set requested by the client.
 * @throws If the server set is not compatible with the client set.
 */
export function validateSupportedLabelSet(
  serverSet: EnsRainbowServerLabelSet,
  clientSet: EnsRainbowClientLabelSet = {},
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
