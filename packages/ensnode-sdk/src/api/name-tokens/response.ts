import type { UnixTimestamp } from "@namehash/ens-referrals";

import type { Node } from "../../ens";
import type { NameToken } from "../../tokenscope";
import type { ErrorResponse } from "../shared/errors";

/**
 * A status code for Name Tokens API responses.
 */
export const NameTokensResponseCodes = {
  /**
   * Represents a response when Name Tokens API can respond with requested data.
   */
  Ok: "ok",

  /**
   * Represents a response when Name Tokens API could not respond with requested data.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link NameTokensResponseCodes}.
 */
export type NameTokensResponseCode =
  (typeof NameTokensResponseCodes)[keyof typeof NameTokensResponseCodes];

/**
 * Error codes for Name Tokens API responses with 'error' response code.
 */
export const NameTokensResponseErrorCodes = {
  /**
   * Name not indexed
   *
   * Represents an error when requested name was not indexed by ENSNode.
   */
  NameNotIndexed: "name-not-indexed-error",

  /**
   * Unsupported ENSIndexer Config
   *
   * Represents a prerequisites error when connected ENSIndexer config lacks
   * params required to enable Name Tokens API.
   */
  EnsIndexerConfigUnsupported: "unsupported-ensindexer-config",

  /**
   * Unsupported Indexing Status
   *
   * Represents a prerequisites error when Indexing Status has not yet reached
   * status required to enable Name Tokens API.
   */
  IndexingStatusUnsupported: "unsupported-indexing-status",
} as const;

/**
 * The derived string union of possible {@link NameTokensResponseErrorCodes}.
 */
export type NameTokensResponseErrorCode =
  (typeof NameTokensResponseErrorCodes)[keyof typeof NameTokensResponseErrorCodes];

export interface RegisteredNameTokens {
  /**
   * Domain ID
   */
  domainId: Node;

  /**
   * Name Tokens associated with the `domainId`.
   */
  tokens: NameToken[];

  /**
   * Expiry date for the Registration Lifecycle associated with the `domainId`.
   *
   * The latest Registration Lifecycle for a node referenced in
   * `token.domainAsset.domainId`.
   */
  expiresAt: UnixTimestamp;
}

/**
 * A response when Name Tokens API can respond with requested data.
 */
export type NameTokensResponseOk = {
  responseCode: typeof NameTokensResponseCodes.Ok;

  /**
   * Name Tokens for the requested name.
   */
  registeredNameTokens: RegisteredNameTokens;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link NameTokensResponseOk.nameTokens} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
};

/**
 * Represents an error response when requested name was not indexed by ENSNode.
 */
export interface NameTokensResponseErrorNameNotIndexed {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.NameNotIndexed;
  error: ErrorResponse;
}

/**
 * Represents an error response when connected ENSIndexer config lacks
 * params required to enable Name Tokens API.
 */
export interface NameTokensResponseErrorEnsIndexerConfigUnsupported {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.EnsIndexerConfigUnsupported;
  error: ErrorResponse;
}

/**
 * Represents an error response when Indexing Status has not yet reached
 * status required to enable Name Tokens API.
 */
export interface NameTokensResponseErrorIndexingStatusUnsupported {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.IndexingStatusUnsupported;
  error: ErrorResponse;
}

export type NameTokensResponseError =
  | NameTokensResponseErrorNameNotIndexed
  | NameTokensResponseErrorEnsIndexerConfigUnsupported
  | NameTokensResponseErrorIndexingStatusUnsupported;

/**
 * Name Tokens response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type NameTokensResponse = NameTokensResponseOk | NameTokensResponseError;
