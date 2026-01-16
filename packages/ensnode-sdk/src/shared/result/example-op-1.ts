import { buildServerErrorResult, type ServerErrorResult } from "./generic-errors";
import { type AbstractResultOk, ResultCodes } from "./types";

export interface ExampleOp1ResultOkData {
  name: string;
}

export interface ExampleOp1ResultOk extends AbstractResultOk<ExampleOp1ResultOkData> {
  resultCode: typeof ResultCodes.Ok;
  data: ExampleOp1ResultOkData;
}

export function buildExampleOp1ResultOk(name: string): ExampleOp1ResultOk {
  return {
    resultCode: ResultCodes.Ok,
    data: {
      name,
    },
  } satisfies ExampleOp1ResultOk;
}

// NOTE: Here we define a union of all possible results returned by the server for this operation.
// We specifically call these "Server Results" because later we need to add all the possible client error results to get
// the full set of all results a client can receive from this operation.
export type ExampleOp1ServerResult = ExampleOp1ResultOk | ServerErrorResult;

export const exampleOperation = async (): Promise<ExampleOp1ServerResult> => {
  if (Math.random() < 0.5) {
    return buildExampleOp1ResultOk("example.eth");
  } else {
    return buildServerErrorResult();
  }
};
