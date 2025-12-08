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
   * Represents a response error for the unknown name context error.
   */
  UnknownNameContext: "unknown-name-context",

  /**
   * Represents a response error for the generic error.
   */
  Generic: "generic",
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
 * A response when Name Tokens API could not respond with requested data
 * due to unknown name context.
 */
export interface NameTokensResponseErrorUnknownNameContext {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.UnknownNameContext;
  error: ErrorResponse;
}

/**
 * A response when Name Tokens API could not respond with requested data
 * due to a generic error.
 */
export interface NameTokensResponseErrorGeneric {
  responseCode: typeof NameTokensResponseCodes.Error;
  errorCode: typeof NameTokensResponseErrorCodes.Generic;
  error: ErrorResponse;
}

export type NameTokensResponseError =
  | NameTokensResponseErrorUnknownNameContext
  | NameTokensResponseErrorGeneric;

/**
 * Name Tokens response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type NameTokensResponse = NameTokensResponseOk | NameTokensResponseError;
