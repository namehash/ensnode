import DataLoader from "dataloader";
import { getUnixTime } from "date-fns";

import type { CanonicalPath, ENSv1DomainId, ENSv2DomainId } from "@ensnode/ensnode-sdk";

import { getV1CanonicalPath, getV2CanonicalPath } from "./lib/get-canonical-path";

/**
 * A Promise.catch handler that provides the thrown error as a resolved value, useful for Dataloaders.
 */
const errorAsValue = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

const createV1CanonicalPathLoader = () =>
  new DataLoader<ENSv1DomainId, CanonicalPath | null>(async (domainIds) =>
    Promise.all(domainIds.map((id) => getV1CanonicalPath(id).catch(errorAsValue))),
  );

const createV2CanonicalPathLoader = () =>
  new DataLoader<ENSv2DomainId, CanonicalPath | null>(async (domainIds) =>
    Promise.all(domainIds.map((id) => getV2CanonicalPath(id).catch(errorAsValue))),
  );

/**
 * Constructs a new GraphQL Context per-request.
 *
 * @dev make sure that anything that is per-request (like dataloaders) are newly created in this fn
 */
export const context = () => ({
  now: BigInt(getUnixTime(new Date())),
  loaders: {
    v1CanonicalPath: createV1CanonicalPathLoader(),
    v2CanonicalPath: createV2CanonicalPathLoader(),
  },
});
