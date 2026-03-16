import { cursors } from "@/graphql-api/lib/cursors";
import { getModelId } from "@/graphql-api/lib/get-model-id";

export const PAGINATION_DEFAULT_PAGE_SIZE = 100;
export const PAGINATION_DEFAULT_MAX_SIZE = 1000;

/**
 * Default Connection field arguments for use with the Relay plugin.
 */
export const ID_PAGINATED_CONNECTION_ARGS = {
  toCursor: <T extends { id: string }>(model: T) => cursors.encode(getModelId(model)),
  defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
  maxSize: PAGINATION_DEFAULT_MAX_SIZE,
} as const;

/**
 * Connection field arguments for entities paginated by a numeric `index` column.
 *
 * @dev we can use the index itself as a cursor because there are no collisions within a given scope
 * (i.e. the `index` is only used once per Domain's Registration or per Registration's Renewal).
 */
export const INDEX_PAGINATED_CONNECTION_ARGS = {
  toCursor: <T extends { index: number }>(model: T) => cursors.encode(String(model.index)),
  defaultSize: PAGINATION_DEFAULT_PAGE_SIZE,
  maxSize: PAGINATION_DEFAULT_MAX_SIZE,
} as const;
