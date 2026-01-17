import type { Address } from "viem";

import type { AbstractResultLoading } from "../result-base";
import { ResultCodes } from "../result-code";
import { callExampleOp, type ExampleOpClientResult } from "./op-client";

export interface ExampleOpLoadingData {
  address: Address;
}

export interface ResultExampleOpLoading extends AbstractResultLoading<ExampleOpLoadingData> {}

export const buildResultExampleOpLoading = (address: Address): ResultExampleOpLoading => {
  return {
    resultCode: ResultCodes.Loading,
    data: {
      address,
    },
  };
};

export type ExampleOpHookResult = ExampleOpClientResult | ResultExampleOpLoading;

export const useExampleOp = (address: Address): ExampleOpHookResult => {
  if (Math.random() < 0.5) {
    return buildResultExampleOpLoading(address);
  } else {
    return callExampleOp(address);
  }
};
