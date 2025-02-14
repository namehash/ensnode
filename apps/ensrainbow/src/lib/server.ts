import { ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk/consts";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import {
  CountError,
  CountResponse,
  CountSuccess,
  HealError,
  HealResponse,
  HealSuccess,
} from "@ensnode/ensrainbow-sdk/types";
import { ByteArray } from "viem";
import { Logger, getLogger } from "@ensnode/utils/logger";
import { parseNonNegativeInteger } from "../utils/number-utils";
import { LABELHASH_COUNT_KEY } from "./database";
import { ENSRainbowDB, safeGet } from "./database";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;
  private readonly logger: Logger;

  constructor(db: ENSRainbowDB) {
    this.db = db;
    this.logger = getLogger();
  }

  async heal(labelhash: `0x${string}`): Promise<HealResponse> {
    let labelHashBytes: ByteArray;
    try {
      labelHashBytes = labelHashToBytes(labelhash);
    } catch (error) {
      const defaultErrorMsg = "Invalid labelhash - must be a valid hex string";
      return {
        status: StatusCode.Error,
        error: (error as Error).message ?? defaultErrorMsg,
        errorCode: ErrorCode.BadRequest,
      } satisfies HealError;
    }

    try {
      const label = await safeGet(this.db, labelHashBytes);
      if (label === null) {
        this.logger.info(`Unhealable labelhash request: ${labelhash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies HealError;
      }

      this.logger.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
      return {
        status: StatusCode.Success,
        label,
      } satisfies HealSuccess;
    } catch (error) {
      this.logger.error("Error healing label:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies HealError;
    }
  }

  async labelCount(): Promise<CountResponse> {
    try {
      const countStr = await safeGet(this.db, LABELHASH_COUNT_KEY);
      if (countStr === null) {
        return {
          status: StatusCode.Error,
          error: "Label count not initialized. Check that the ingest command has been run.",
          errorCode: ErrorCode.ServerError,
        } satisfies CountError;
      }

      const count = parseNonNegativeInteger(countStr);
      if (count === null) {
        this.logger.error(`Invalid label count value in database: ${countStr}`);
        return {
          status: StatusCode.Error,
          error: "Internal server error: Invalid label count format",
          errorCode: ErrorCode.ServerError,
        } satisfies CountError;
      }

      return {
        status: StatusCode.Success,
        count,
        timestamp: new Date().toISOString(),
      } satisfies CountSuccess;
    } catch (error) {
      this.logger.error("Failed to retrieve label count:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies CountError;
    }
  }
}
