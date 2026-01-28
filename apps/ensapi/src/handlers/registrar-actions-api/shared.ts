import z from "zod/v4";

import {
  buildPageContext,
  type Node,
  RECORDS_PER_PAGE_DEFAULT,
  RECORDS_PER_PAGE_MAX,
  type RegistrarActionsFilter,
  RegistrarActionsOrders,
  registrarActionsFilter,
} from "@ensnode/ensnode-sdk";
import {
  makeLowercaseAddressSchema,
  makeNodeSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { findRegistrarActions } from "@/lib/registrar-actions/find-registrar-actions";

// Shared params schema for registrar actions
export const registrarActionsParamsSchema = z.object({
  parentNode: makeNodeSchema("parentNode param").describe(
    "Parent node to filter registrar actions",
  ),
});

// Shared query schema for registrar actions
export const registrarActionsQuerySchema = z
  .object({
    orderBy: z
      .enum(RegistrarActionsOrders)
      .default(RegistrarActionsOrders.LatestRegistrarActions)
      .describe("Order of results"),

    page: params.queryParam
      .optional()
      .default(1)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("page"))
      .describe("Page number for pagination"),

    recordsPerPage: params.queryParam
      .optional()
      .default(RECORDS_PER_PAGE_DEFAULT)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("recordsPerPage").max(RECORDS_PER_PAGE_MAX))
      .describe("Number of records per page"),

    withReferral: params.boolstring
      .optional()
      .default(false)
      .describe("Filter to only include actions with referrals"),

    decodedReferrer: makeLowercaseAddressSchema("decodedReferrer")
      .optional()
      .describe("Filter by decoded referrer address"),

    beginTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("beginTimestamp"))
      .optional()
      .describe("Filter actions at or after this Unix timestamp"),

    endTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("endTimestamp"))
      .optional()
      .describe("Filter actions at or before this Unix timestamp"),
  })
  .refine(
    (data) => {
      // If both timestamps are provided, endTimestamp must be >= beginTimestamp
      if (data.beginTimestamp !== undefined && data.endTimestamp !== undefined) {
        return data.endTimestamp >= data.beginTimestamp;
      }
      return true;
    },
    {
      message: "endTimestamp must be greater than or equal to beginTimestamp",
      path: ["endTimestamp"],
    },
  );

// Shared business logic for fetching registrar actions
export async function fetchRegistrarActions(
  parentNode: Node | undefined,
  query: z.infer<typeof registrarActionsQuerySchema>,
) {
  const {
    orderBy,
    page,
    recordsPerPage,
    withReferral,
    decodedReferrer,
    beginTimestamp,
    endTimestamp,
  } = query;

  const filters: RegistrarActionsFilter[] = [];

  if (parentNode) {
    filters.push(registrarActionsFilter.byParentNode(parentNode));
  }

  if (withReferral) {
    filters.push(registrarActionsFilter.withReferral(true));
  }

  if (decodedReferrer) {
    filters.push(registrarActionsFilter.byDecodedReferrer(decodedReferrer));
  }

  if (beginTimestamp) {
    filters.push(registrarActionsFilter.beginTimestamp(beginTimestamp));
  }

  if (endTimestamp) {
    filters.push(registrarActionsFilter.endTimestamp(endTimestamp));
  }

  // Calculate offset from page and recordsPerPage
  const offset = (page - 1) * recordsPerPage;

  // Find the latest "logical registrar actions" with pagination
  const { registrarActions, totalRecords } = await findRegistrarActions({
    filters,
    orderBy,
    limit: recordsPerPage,
    offset,
  });

  // Build page context
  const pageContext = buildPageContext(page, recordsPerPage, totalRecords);

  return { registrarActions, pageContext };
}
