import type { Address } from "viem";

import {
  EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES,
  type ExampleOpServerResult,
  exampleOp,
} from "./example-op-server";
import {
  buildResultClientUnrecognizedOperationResult,
  buildResultConnectionError,
  buildResultRequestTimeout,
  isRecognizedResultCodeForOperation,
  type ResultClientError,
} from "./result-common";

export type ExampleOpClientResult = ExampleOpServerResult | ResultClientError;

export const callExampleOp = (address: Address): ExampleOpClientResult => {
  try {
    const result = exampleOp(address);

    // ensure server result code is recognized by this client version
    if (
      isRecognizedResultCodeForOperation(
        result.resultCode,
        EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES,
      )
    ) {
      return buildResultClientUnrecognizedOperationResult(result);
    }

    // return server result
    return result;
  } catch (error) {
    // handle client-side errors
    if (error === "connection-error") {
      return buildResultConnectionError();
    } else {
      return buildResultRequestTimeout();
    }
  }
};
