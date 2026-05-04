/**
 * Omnigraph server-side cap for `Query.labels(by: { labelHashes })`.
 *
 * This limit is enforced in ENSApi and must be respected by any callers that batch requests
 * (e.g. EnsRainbowBeam) to avoid `BAD_USER_INPUT` errors.
 */
export const OMNIGRAPH_LABELS_BY_LABELHASH_MAX = 100 as const;
