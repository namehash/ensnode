import type { Address } from "viem";
import { zeroAddress } from "viem";

import type { AbstractResultOk } from "../result-base";
import { type AssertResultCodeExact, type ExpectTrue, ResultCodes } from "../result-code";
import {
  buildResultInternalServerError,
  buildResultInvalidRequest,
  type ResultInternalServerError,
  type ResultInvalidRequest,
} from "../result-common";

export interface ResultExampleOpOkData {
  name: string;
}

export interface ResultExampleOpOk extends AbstractResultOk<ResultExampleOpOkData> {}

export const buildResultExampleOpOk = (name: string): ResultExampleOpOk => {
  return {
    resultCode: ResultCodes.Ok,
    data: {
      name,
    },
  };
};

// NOTE: Here we define a union of all possible results returned by the server for this operation.
// We specifically call these "Server Results" because later we need to add all the possible client error results to get
// the full set of all results a client can receive from this operation.
export type ExampleOpServerResult =
  | ResultExampleOpOk
  | ResultInternalServerError
  | ResultInvalidRequest;

export type ExampleOpServerResultCode = ExampleOpServerResult["resultCode"];

export const EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES = [
  ResultCodes.Ok,
  ResultCodes.InternalServerError,
  ResultCodes.InvalidRequest,
] as const satisfies readonly ExampleOpServerResultCode[];

// Intentionally unused: compile-time assertion that the recognized result codes
// exactly match the union of ExampleOpServerResult["resultCode"].
type AssertExampleOpServerResultCodesMatch = ExpectTrue<
  AssertResultCodeExact<ExampleOpServerResultCode, typeof EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES>
>;

export const exampleOp = (address: Address): ExampleOpServerResult => {
  if (address === zeroAddress) {
    return buildResultInvalidRequest("Address must not be the zero address");
  }
  if (Math.random() < 0.5) {
    return buildResultExampleOpOk("example.eth");
  } else {
    return buildResultInternalServerError(
      "Invariant violation: random number is not less than 0.5",
    );
  }
};
