import { cursors } from "@/omnigraph-api/lib/cursors";
import { getModelId } from "@/omnigraph-api/lib/get-model-id";

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

/** Shared `accelerate` argument for `Domain.resolve` and `Account.resolve`. */
export const RESOLVE_ACCELERATE_ARG = {
  required: false,
  defaultValue: true,
  description:
    "When true (default), Protocol Acceleration is used for record resolution, when supported.\n@see https://ensnode.io/docs/integrate/omnigraph/protocol-acceleration",
} as const;
