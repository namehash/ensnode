/**
 * Example of a simple client-side application client that calls an operation
 * returning Result data model.
 *
 * In a real-world scenario, this could be part of a frontend application
 * calling a client to send a request to a backend service and handle
 * the response.
 *
 * In this example, we show how to handle both successful and error results
 * returned by the operation. This includes a retry suggestion for
 * certain error cases.
 */
import type { Address } from "viem";

import { ResultCodes } from "../result-code";
import { callExampleOp } from "./op-client";

export const myExampleDXClient = (address: Address): void => {
  const result = callExampleOp(address);

  if (result.resultCode === ResultCodes.Ok) {
    // NOTE: Here the type system knows that `result` is of type `ResultExampleOpOk`
    console.log(result.data.name);
  } else {
    // NOTE: Here the type system knows that `result` has fields for `errorMessage` and `suggestRetry`
    console.error(`Error: (${result.resultCode}) - ${result.data.errorMessage}`);
    if (result.data.suggestRetry) {
      console.log("Try again?");
    }
  }
};
