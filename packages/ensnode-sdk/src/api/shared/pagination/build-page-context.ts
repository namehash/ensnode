import type {
  ResponsePageContext,
  ResponsePageContextWithNoRecords,
  ResponsePageContextWithRecords,
} from "./response";

/**
 * Build page context from request params and total records count.
 */
export function buildPageContext(
  page: number,
  recordsPerPage: number,
  totalRecords: number,
): ResponsePageContext {
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  if (page > totalPages) {
    throw new Error(`Invalid page: page ${page} exceeds total pages ${totalPages}.`);
  }

  if (totalRecords === 0) {
    return {
      page,
      recordsPerPage,
      totalRecords: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    } satisfies ResponsePageContextWithNoRecords;
  }

  const startIndex = (page - 1) * recordsPerPage;
  const maxTheoreticalIndexOnPage = startIndex + (recordsPerPage - 1);
  const endIndex = Math.min(maxTheoreticalIndexOnPage, totalRecords - 1);
  const hasNext = maxTheoreticalIndexOnPage < totalRecords - 1;
  const hasPrev = page > 1;

  return {
    page,
    recordsPerPage,
    totalRecords,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
  } satisfies ResponsePageContextWithRecords;
}
