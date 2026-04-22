import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";
import type { CanonicalPath, DomainId } from "enssdk";

import { getCanonicalPath } from "./lib/get-canonical-path";

/**
 * A Promise.catch handler that provides the thrown error as a resolved value, useful for Dataloaders.
 */
const errorAsValue = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const createCanonicalPathLoader = () =>
  new DataLoader<DomainId, CanonicalPath | null>(async (domainIds) =>
    Promise.all(domainIds.map((id) => getCanonicalPath(id).catch(errorAsValue))),
  );

/**
 * Constructs a new GraphQL Context per-request.
 *
 * @dev make sure that anything that is per-request (like dataloaders) are newly created in this fn
 */
export const context = () => ({
  now: BigInt(getUnixTime(new Date())),
  loaders: {
    canonicalPath: createCanonicalPathLoader(),
  },
});
