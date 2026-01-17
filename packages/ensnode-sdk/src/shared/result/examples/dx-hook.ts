/**
 * Example of a simple client-side DX hook that consumes an operation
 * returning Result data model.
 *
 * In a real-world scenario, this could be part of a React component
 * calling a hook to manage async data fetching.
 *
 * In this example, we show how to handle both successful and error results
 * returned by the operation. This includes a retry suggestion for
 * certain error cases.
 */
import type { Address } from "viem";

import { ResultCodes } from "../result-code";
import { useExampleOp } from "./op-hook";

export const myExampleDXHook = (address: Address): void => {
  const result = useExampleOp(address);

  if (result.resultCode === ResultCodes.Loading) {
    // NOTE: Here the type system knows that `result` is of type `ResultExampleOpLoading`
    console.log("Loading...");
  } else if (result.resultCode === ResultCodes.Ok) {
    // NOTE: Here the type system knows that `result` is of type `ResultExampleOpOk`
    console.log(result.data.name);
  } else {
    // NOTE: Here the type system knows that `result` has fields for `errorMessage` and `suggestRetry`
    console.error(`Error: (${result.resultCode}) - ${result.errorMessage}`);
    if (result.suggestRetry) {
      console.log("Try again?");
    }
  }
};
