/**
 * Example of a simple client-side operation that calls a server operation
 * and returns Result data model.
 *
 * Note: In a real-world scenario, this would involve making an HTTP request
 * to a server endpoint. Here, for simplicity, we directly call the server
 * operation function.
 *
 * We also simulate client-side errors like connection errors and timeouts.
 *
 * If the server returns a result code that is not recognized by this client
 * version, the client handles it by returning a special unrecognized operation
 * result.
 */
import type { Address } from "viem";

import {
  buildResultClientUnrecognizedOperationResult,
  buildResultConnectionError,
  buildResultRequestTimeout,
  isRecognizedResultCodeForOperation,
  type ResultClientError,
} from "../result-common";
import {
  EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES,
  type ExampleOpServerResult,
  exampleOp,
} from "./op-server";

export type ExampleOpClientResult = ExampleOpServerResult | ResultClientError;

export const callExampleOp = (address: Address): ExampleOpClientResult => {
  try {
    const result = exampleOp(address);

    // ensure server result code is recognized by this client version
    if (
      !isRecognizedResultCodeForOperation(
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
