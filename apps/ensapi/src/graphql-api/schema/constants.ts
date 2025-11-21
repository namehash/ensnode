import { getModelId } from "@/graphql-api/lib/get-model-id";
import { cursors } from "@/graphql-api/schema/cursors";

/**
 * Default Connection field arguments for use with the Relay plugin.
 */
export const DEFAULT_CONNECTION_ARGS = {
  toCursor: <T extends { id: string }>(model: T) => cursors.encode(getModelId(model)),
  defaultSize: 100,
  maxSize: 1000,
} as const;
