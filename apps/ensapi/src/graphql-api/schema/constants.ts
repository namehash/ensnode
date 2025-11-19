import { cursors } from "@/graphql-api/schema/cursors";

export const DEFAULT_CONNECTION_ARGS = {
  toCursor: <T extends { id: string }>(model: T) => cursors.encode(model.id),
  defaultSize: 100,
  maxSize: 1000,
} as const;
