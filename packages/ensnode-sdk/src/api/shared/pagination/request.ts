export const ITEMS_PER_PAGE_DEFAULT = 10;

export const ITEMS_PER_PAGE_MAX = 100;

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
   * Maximum number of items to return per page
   * @invariant Must be a positive integer (>= 1) and less than or equal to {@link ITEMS_PER_PAGE_MAX}
   * @default {@link ITEMS_PER_PAGE_DEFAULT}
   */
  itemsPerPage?: number;
}
