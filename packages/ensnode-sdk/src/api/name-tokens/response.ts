import type { InterpretedName, Node } from "../../ens";
import type { UnixTimestamp } from "../../shared/types";
import type { NameToken, NameTokenOwnershipTypes } from "../../tokenscope";
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
   * Name tokens not indexed
   *
   * Represents an error when tokens for the requested name are not indexed by
   * the ENSNode instance's configuration.
   */
  NameTokensNotIndexed: "name-tokens-not-indexed",

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

/**
 * Name Tokens for a name who's tokens are configured to
 * be indexed by the ENSNode instance's configuration.
 */
export interface RegisteredNameTokens {
  /**
   * Domain ID
   */
  domainId: Node;

  /**
   * Name
   *
   * FQDN of the name associated with `domainId`.
   *
   * Guarantees:
   * - `namehash(name)` is always `domainId`.
   */
  name: InterpretedName;

  /**
   * Name Tokens associated with the `domainId`.
   *
   * It contains every tokenized representation of `name` that
   * has ever been indexed for the given name as of `accurateAsOf`,
   * even if the given token has been burned or expired.
   *
   * Guarantees:
   * - Always includes at least one name token.
   * - When it includes more than one name token, it means that:
   *   1) More than 1 distinct tokenized representation of the ownership of
   *      the `name` has been indexed as of `accurateAsOf`.
   *   2) All possible permutations of mint statuses of these tokens are
   *      possible:
   *      a) Multiple could be actively minted.
   *      b) Multiple could be burned.
   *      c) Some could be burned, others could be minted.
   *  - Order of name tokens follows the order of onchain events that were
   *    indexed when a token was minted, or burned.
   *  - Each name token has a distinct `token` value which references
   *    the NFT that currently or previously tokenized ownership of `name`.
   *  - Each name token has ownership type (`ownership.ownershipType`) assigned:
   *   - If there's a name token with ownership type
   *     {@link NameTokenOwnershipTypes.NameWrapper}, it means that there must be also
   *     another name token with ownership type either
   *     {@link NameTokenOwnershipTypes.FullyOnchain}, or
   *     {@link NameTokenOwnershipTypes.Unknown}.
   *   - There can be at most one name token with ownership type
   *     {@link NameTokenOwnershipTypes.FullyOnchain}.
   *   - There can be any number of name tokens with ownership type
   *     {@link NameTokenOwnershipTypes.Burned}.
   *
   * NOTE: It can be useful to get tokenized representations of the name that
   * are now burned: This can be helpful for looking up historical activity for
   * the name, including past buy orders, sell orders, and sales.
   *
   * How will the direct subnames of .eth that are wrapped by the NameWrapper
   * be represented?
   * 1) A direct subname of .eth that has been registered but
   *    has never been wrapped by the NameWrapper, and:
   *    a) Is still actively minted (independent of its expiry state).
   *    b) Has been burned by sending it to the null address.
   * 2) A direct subname of .eth that has been registered and
   *    has been wrapped by the NameWrapper, and:
   *    a) Is still actively wrapped by the NameWrapper (independent of its
   *       expiry state).
   *    b) Is no longer wrapped by the NameWrapper, but is still actively
   *       minted by the BaseRegistrar (independent of its expiry state).
   *    c) Is no longer wrapped by the NameWrapper, and is also no longer
   *       minted by the BaseRegistrar (both tokens now burned by sending to
   *       the null address).
   */
  tokens: NameToken[];

  /**
   * Expiry date for the Registration Lifecycle
   *
   * The latest Registration Lifecycle for a node referenced in `domainId`.
   */
  expiresAt: UnixTimestamp;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link NameTokensResponseOk.nameTokens} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
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
};

/**
 * Represents an error response when requested name was not indexed by ENSNode.
 */
export interface NameTokensResponseErrorNameTokensNotIndexed {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.NameTokensNotIndexed;
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
  | NameTokensResponseErrorNameTokensNotIndexed
  | NameTokensResponseErrorEnsIndexerConfigUnsupported
  | NameTokensResponseErrorIndexingStatusUnsupported;

/**
 * Name Tokens response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type NameTokensResponse = NameTokensResponseOk | NameTokensResponseError;
