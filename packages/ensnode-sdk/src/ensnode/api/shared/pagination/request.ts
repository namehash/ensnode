export const RECORDS_PER_PAGE_DEFAULT = 10;

export const RECORDS_PER_PAGE_MAX = 100;

/**
 * Request page params.
 */
export interface RequestPageParams {
  /**
   * Requested page number (1-indexed)
   * @invariant Must be a positive integer (>= 1)
   * @default 1
   */
  page?: number;

  /**
   * Maximum number of records to return per page
   * @invariant Must be a positive integer (>= 1) and less than or equal to {@link RECORDS_PER_PAGE_MAX}
   * @default {@link RECORDS_PER_PAGE_DEFAULT}
   */
  recordsPerPage?: number;
}
