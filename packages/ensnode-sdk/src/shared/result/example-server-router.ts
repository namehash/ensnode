import type { Address } from "viem";

import { exampleOp } from "./example-op-server";
import type { AbstractResult } from "./result-base";
import type { ResultCode } from "./result-code";
import { buildResultInternalServerError, buildResultNotFound } from "./result-common";

const routeRequest = (path: string): AbstractResult<ResultCode> => {
  // imagine Hono router logic here
  try {
    if (path === "/example") {
      return exampleOp("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address);
    } else {
      // guarantee in all cases we return our Result data model
      return buildResultNotFound(`Path not found: ${path}`);
    }
  } catch (error) {
    // guarantee in all cases we return our Result data model
    const errorMessage = error instanceof Error ? error.message : undefined;
    return buildResultInternalServerError(errorMessage);
  }
};
