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
    console.error(`Error: (${result.resultCode}) - ${result.errorMessage}`);
    if (result.suggestRetry) {
      console.log("Try again?");
    }
  }
};
