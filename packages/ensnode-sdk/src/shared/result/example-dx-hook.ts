import type { Address } from "viem";

import { useExampleOp } from "./example-op-hook";
import { ResultCodes } from "./result-code";

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
