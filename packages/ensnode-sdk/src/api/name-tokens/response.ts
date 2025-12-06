import type { UnixTimestamp } from "@namehash/ens-referrals";

import type { RegistrationLifecycle } from "../../registrars";
import { type NameToken, NFTMintStatus, NFTMintStatuses } from "../../tokenscope";
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

/**
 * Token Statuses
 *
 * Extends {@link NFTMintStatuses} with additional "virtual" statuses.
 */
export const RegisteredNameTokenStatuses = {
  ...NFTMintStatuses,

  Expired: "expired",
} as const;

/**
 * Token Status
 *
 * Extends {@link NFTMintStatus} with additional "virtual" statuses.
 */
export type RegisteredNameTokenStatus =
  (typeof RegisteredNameTokenStatuses)[keyof typeof RegisteredNameTokenStatuses];

export interface RegisteredNameToken {
  token: NameToken;

  /**
   * Registration Lifecycle
   *
   * The latest Registration Lifecycle for a node referenced in
   * `token.domainAsset.domainId`.
   */
  registrationLifecycle: RegistrationLifecycle;

  /**
   * Token Status
   *
   * Derived from `token.mintStatus`.
   *
   * Set to `expired` when:
   * - the `token.mintStatus` is "mint" however the latest registration lifecycle expiresAt is in the past.
   */
  tokenStatus: RegisteredNameTokenStatus;
}

/**
 * A response when Name Tokens API can respond with requested data.
 */
export type NameTokensResponseOk = {
  responseCode: typeof NameTokensResponseCodes.Ok;

  /**
   * Name Tokens for the requested name.
   */
  nameTokens: RegisteredNameToken[];

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
