import { ErrorResponse } from "@ensnode/ensnode-sdk";
import type { Context } from "hono";
import { ZodError, treeifyError } from "zod/v4";

export const errorResponse = (c: Context, input: ZodError | Error | string | unknown) => {
  if (input instanceof ZodError) {
    return c.json(
      { message: "Invalid Input", details: treeifyError(input) } satisfies ErrorResponse,
      400,
    );
  }

  if (input instanceof Error) {
    return c.json({ message: input.message } satisfies ErrorResponse, 500);
  }

  if (typeof input === "string") {
    return c.json({ message: input } satisfies ErrorResponse, 500);
  }

  return c.json({ message: "Internal Error" } satisfies ErrorResponse, 500);
};
