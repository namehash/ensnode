import { ByteArray } from "viem";
import { LABELHASH_COUNT_KEY } from "../utils/constants.js";
import { labelHashToBytes } from "../utils/label-utils.js";
import { createLogger, LogLevel } from "../utils/logger.js";
import { parseNonNegativeInteger } from "../utils/number-utils.js";
import {
  CountError,
  CountResponse,
  CountSuccess,
  ErrorCode,
  HealError,
  HealResponse,
  HealSuccess,
  StatusCode,
} from "../utils/response-types.js";
import { ENSRainbowDB, safeGet } from "./database.js";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;
  private readonly logLevel?: LogLevel;

  constructor(db: ENSRainbowDB, logLevel?: LogLevel) {
    this.db = db;
    this.logLevel = logLevel;
  }

  async heal(labelhash: `0x${string}`): Promise<HealResponse> {
    const logger = createLogger(this.logLevel);
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
        logger.info(`Unhealable labelhash request: ${labelhash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies HealError;
      }
      
      logger.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
      return {
        status: StatusCode.Success,
        label,
      } satisfies HealSuccess;
    } catch (error) {
      logger.error("Error healing label:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies HealError;
    }
  }

  async labelCount(): Promise<CountResponse> {
    const logger = createLogger(this.logLevel);
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
        logger.error(`Invalid label count value in database: ${countStr}`);
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
      logger.error("Failed to retrieve label count:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies CountError;
    }
  }
} 
