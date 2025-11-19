import { RealtimeIndexingStatusProjection } from "@ensnode/ensnode-sdk";

export const StatefulFetchStatusIds = {
  /**
   * Fetching hasn't started yet because a stateful ENSNode connection hasn't been created yet.
   */
  Connecting: "connecting",

  /**
   * A fetch operation has been initiated that hasn't completed yet.
   */
  Loading: "loading",

  /**
   * Fetch completed with an error.
   */
  Error: "error",

  /**
   * Fetch successfully completed.
   */
  Loaded: "loaded",
} as const;

export type StatefulFetchStatusId =
  (typeof StatefulFetchStatusIds)[keyof typeof StatefulFetchStatusIds];

export interface StatefulFetchIndexingStatusConnecting {
  fetchStatus: typeof StatefulFetchStatusIds.Connecting;
}

export interface StatefulFetchIndexingStatusLoading {
  fetchStatus: typeof StatefulFetchStatusIds.Loading;
}

export interface StatefulFetchIndexingStatusError {
  fetchStatus: typeof StatefulFetchStatusIds.Error;
  reason: string;
}

export interface StatefulFetchIndexingStatusLoaded {
  fetchStatus: typeof StatefulFetchStatusIds.Loaded;
  realtimeProjection: RealtimeIndexingStatusProjection;
}

export type StatefulFetchIndexingStatus =
  | StatefulFetchIndexingStatusConnecting
  | StatefulFetchIndexingStatusLoading
  | StatefulFetchIndexingStatusError
  | StatefulFetchIndexingStatusLoaded;
