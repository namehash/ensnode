/**
 * Classifies a result returned by an operation.
 */
export const ResultCodes = {
  /**
   * Indefinite result.
   */
  Loading: "loading",

  /**
   * Successful result.
   */
  Ok: "ok",

  /**
   * Server error: the operation failed due to an unexpected error internally within the server.
   */
  InternalServerError: "internal-server-error",

  /**
   * Server error: the requested resource was not found.
   */
  NotFound: "not-found",

  /**
   * Server and client error: the request was invalid.
   */
  InvalidRequest: "invalid-request",

  /**
   * Client error: the connection to the server failed.
   */
  ConnectionError: "connection-error",

  /**
   * Client error: the request timed out.
   */
  RequestTimeout: "request-timeout",

  /**
   * Client error: received an unexpected result code from the server.
   */
  UnknownError: "unknown-error",
} as const;

export const RESULT_CODE_SERVER_AND_CLIENT_ERROR_CODES = [ResultCodes.InvalidRequest] as const;

export const RESULT_CODE_SERVER_ERROR_CODES = [
  ResultCodes.InternalServerError,
  ResultCodes.NotFound,
  ...RESULT_CODE_SERVER_AND_CLIENT_ERROR_CODES,
] as const;

export const RESULT_CODE_CLIENT_ERROR_CODES = [
  ResultCodes.ConnectionError,
  ResultCodes.RequestTimeout,
  ResultCodes.UnknownError,
  ...RESULT_CODE_SERVER_AND_CLIENT_ERROR_CODES,
] as const;

const RESULT_CODE_ERROR_CODES = [
  ...RESULT_CODE_SERVER_ERROR_CODES,
  ...RESULT_CODE_CLIENT_ERROR_CODES,
] as const;

const RESULT_CODE_ALL_CODES = [
  ResultCodes.Loading,
  ResultCodes.Ok,
  ...RESULT_CODE_ERROR_CODES,
] as const;

/**
 * Classifies a result returned by an operation.
 */
export type ResultCode = (typeof ResultCodes)[keyof typeof ResultCodes];

/**
 * ResultCode for a result that is not yet determined.
 */
export type ResultCodeIndefinite = typeof ResultCodes.Loading;

/**
 * ResultCode for a result that has been determined.
 */
export type ResultCodeDefinite = Exclude<ResultCode, ResultCodeIndefinite>;

/**
 * ResultCode for an error result that may be determined by the server.
 */
export type ResultCodeServerError = (typeof RESULT_CODE_SERVER_ERROR_CODES)[number];

/**
 * ResultCode for an error result that may be determined by the client.
 */
export type ResultCodeClientError = (typeof RESULT_CODE_CLIENT_ERROR_CODES)[number];

/**
 * ResultCode for a result that is an error.
 */
export type ResultCodeError = (typeof RESULT_CODE_ERROR_CODES)[number];

/************************************************************
 * Compile-time helpers to ensure invariants expected of
 * definitions above are maintained and don't become
 * out of sync.
 ************************************************************/

export type ExpectTrue<T extends true> = T;

export type ResultCodesFromList<List extends readonly ResultCode[]> = List[number];

export type AssertResultCodeSuperset<
  Union extends ResultCode,
  List extends readonly ResultCode[],
> = Union extends ResultCodesFromList<List> ? true : false;

export type AssertResultCodeSubset<
  Union extends ResultCode,
  List extends readonly ResultCode[],
> = ResultCodesFromList<List> extends Union ? true : false;

export type AssertResultCodeExact<
  Union extends ResultCode,
  List extends readonly ResultCode[],
> = AssertResultCodeSuperset<Union, List> extends true
  ? AssertResultCodeSubset<Union, List> extends true
    ? true
    : false
  : false;

type _CompileTimeCheck_ResultCodeErrorMatchesUnion = ExpectTrue<
  AssertResultCodeExact<ResultCodeError, typeof RESULT_CODE_ERROR_CODES>
>;

type _CompileTimeCheck_ResultCodeMatchesUnion = ExpectTrue<
  AssertResultCodeExact<ResultCode, typeof RESULT_CODE_ALL_CODES>
>;
