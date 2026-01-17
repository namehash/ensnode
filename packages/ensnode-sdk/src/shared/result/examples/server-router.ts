/**
 * Example of a simple server-side router handling requests and
 * returning Result data model.
 *
 * In a real-world scenario, this could be part of a backend service
 * using a framework like Hono to route requests and return structured
 * responses.
 *
 * In this example, we show how different results are returned
 * based on the request path, including delegating to an operation
 * that also returns Result data model.
 */
import type { Address } from "viem";

import type { AbstractResult } from "../result-base";
import type { ResultCode } from "../result-code";
import { buildResultInternalServerError, buildResultNotFound } from "../result-common";
import { exampleOp } from "./op-server";

const _routeRequest = (path: string): AbstractResult<ResultCode> => {
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
