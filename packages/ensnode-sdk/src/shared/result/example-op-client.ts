import type { Address } from "viem";

import {
  EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES,
  type ExampleOpServerResult,
  exampleOp,
} from "./example-op-server";
import {
  buildResultConnectionError,
  buildResultRequestTimeout,
  buildResultUnknownError,
  hasUnrecognizedResultCode,
  type ResultClientError,
} from "./result-common";

export type ExampleOpClientResult = ExampleOpServerResult | ResultClientError;

export const callExampleOp = (address: Address): ExampleOpClientResult => {
  try {
    const result = exampleOp(address);

    // ensure server result code is recognized by this client version
    if (hasUnrecognizedResultCode(result, EXAMPLE_OP_RECOGNIZED_SERVER_RESULT_CODES)) {
      return buildResultUnknownError(result);
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
