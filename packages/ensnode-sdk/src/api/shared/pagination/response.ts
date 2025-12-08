import type { RequestPageParams } from "./request";

export interface ResponsePageContextWithNoRecords extends Required<RequestPageParams> {
  /**
   * Total number of records across all pages
   */
  totalRecords: 0;

  /**
   * Total number of pages
   */
  totalPages: 1;

  /**
   * Indicates if there is a next page available
   */
  hasNext: false;

  /**
   * Indicates if there is a previous page available
   */
  hasPrev: false;

  /**
   * The start index of the records on the page (0-indexed)
   */
  startIndex: undefined;

  /**
   * The end index of the records on the page (0-indexed)
   */
  endIndex: undefined;
}

export interface ResponsePageContextWithRecords extends Required<RequestPageParams> {
  /**
   * Total number of records across all pages
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  totalRecords: number;

  /**
   * Total number of pages
   * @invariant Guaranteed to be a positive integer (>= 1)
   */
  totalPages: number;

  /**
   * Indicates if there is a next page available
   * @invariant true if and only if (`page` * `recordsPerPage` < `totalRecords`)
   */
  hasNext: boolean;

  /**
   * Indicates if there is a previous page available
   * @invariant true if and only if (`page` > 1)
   */
  hasPrev: boolean;

  /**
   * The start index of the records on the page (0-indexed)
   *
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   */
  startIndex: number;

  /**
   * The end index of the records on the page (0-indexed)
   *
   * @invariant Guaranteed to be a non-negative integer (>= 0)
   * @invariant Guaranteed to be greater than or equal to `startIndex`.
   * @invariant Guaranteed to be less than `totalRecords`.
   */
  endIndex: number;
}

export type ResponsePageContext = ResponsePageContextWithNoRecords | ResponsePageContextWithRecords;
