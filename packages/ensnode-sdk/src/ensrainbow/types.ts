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
 * A label set version identifies a specific version of a label set. It allows clients to
 * request data from a specific snapshot in time, ensuring deterministic results.
 *
 * It is guaranteed to be a non-negative integer.
 */
export type LabelSetVersion = number;

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
   * results across time even if the ENSRainbow server ingests label sets with greater versions
   * than this value. If provided, only labels from label sets with versions less than or equal to this
   * value will be returned. If not provided, the server will use the latest available version.
   * When `labelSetVersion` is defined, `labelSetId` must also be defined.
   */
  labelSetVersion?: LabelSetVersion;
}

/**
 * The state of label sets managed by an ENSRainbow server.
 */
export interface EnsRainbowServerLabelSet {
  /**
   * The LabelSetId managed by the ENSRainbow server.
   */
  labelSetId: LabelSetId;

  /**
   * The highest label set version available on the ENSRainbow server for the current
   * label set ID. This represents the most recent version of the label set that the
   * server has ingested and can provide label healing results for.
   */
  highestLabelSetVersion: LabelSetVersion;
}
