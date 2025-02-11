import { ClassicLevel } from "classic-level";
import { ErrorCode, StatusCode } from "ensrainbow-sdk/consts";
import { labelHashToBytes } from "ensrainbow-sdk/label-utils";
import type {
  CountError,
  CountResponse,
  CountSuccess,
  HealError,
  HealResponse,
  HealSuccess,
} from "ensrainbow-sdk/types";
import { ByteArray } from "viem";
import { LABELHASH_COUNT_KEY } from "./utils/constants.js";

export interface ENSRainbowContext {
  db: ClassicLevel<ByteArray, string>;
}

export const heal = async (
  context: ENSRainbowContext,
  labelhash: `0x${string}`,
): Promise<HealResponse> => {
  let labelHashBytes: ByteArray;
  try {
    labelHashBytes = labelHashToBytes(labelhash);
  } catch (error) {
    const defaultErrorMsg = "Invalid labelhash - must be a valid hex string";
    const result: HealError = {
      status: StatusCode.Error,
      error: (error as Error).message ?? defaultErrorMsg,
      errorCode: ErrorCode.BadRequest,
    };
    return result;
  }

  try {
    const label = await context.db.get(labelHashBytes);
    console.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
    const result: HealSuccess = {
      status: StatusCode.Success,
      label,
    };
    return result;
  } catch (error) {
    if ((error as any).code === "LEVEL_NOT_FOUND") {
      if (process.env.NODE_ENV === "development") {
        console.info(`Unhealable labelhash request: ${labelhash}`);
      }
      const result: HealError = {
        status: StatusCode.Error,
        error: "Label not found",
        errorCode: ErrorCode.NotFound,
      };
      return result;
    }
    console.error("Error healing label:", error);
    const result: HealError = {
      status: StatusCode.Error,
      error: "Internal server error",
      errorCode: ErrorCode.ServerError,
    };
    return result;
  }
};

export const countLabels = async (context: ENSRainbowContext): Promise<CountResponse> => {
  try {
    const countStr = await context.db.get(LABELHASH_COUNT_KEY);
    const count = parseInt(countStr, 10);

    const result: CountSuccess = {
      status: StatusCode.Success,
      count,
      timestamp: new Date().toISOString(),
    };
    return result;
  } catch (error) {
    console.error("Failed to retrieve label count:", error);
    const result: CountError = {
      status: StatusCode.Error,
      error: "Internal server error",
      errorCode: ErrorCode.ServerError,
    };
    return result;
  }
};
