import { ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk/consts";
import { labelHashToBytes } from "@ensnode/ensrainbow-sdk/label-utils";
import {
  CountResponse,
  CountServerError,
  CountSuccess,
  HealBadRequestError,
  HealNotFoundError,
  HealResponse,
  HealServerError,
  HealSuccess,
} from "@ensnode/ensrainbow-sdk/types";
import { ByteArray } from "viem";
import { LogLevel, Logger, createLogger } from "../utils/logger";
import { parseNonNegativeInteger } from "../utils/number-utils";
import { LABELHASH_COUNT_KEY, isIngestionInProgress } from "./database";
import { ENSRainbowDB, safeGet } from "./database";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;
  private readonly logger: Logger;

  private constructor(db: ENSRainbowDB, logLevel?: LogLevel) {
    this.db = db;
    this.logger = createLogger(logLevel);
  }

  /**
   * Creates a new ENSRainbowServer instance
   * @param db The ENSRainbowDB instance
   * @param logLevel Optional log level
   * @throws Error if a "lite" validation of the database fails
   */
  public static async init(db: ENSRainbowDB, logLevel?: LogLevel): Promise<ENSRainbowServer> {
    const server = new ENSRainbowServer(db, logLevel);

    // Verify that the attached db fully completed its ingestion (ingestion not interrupted)
    if (await isIngestionInProgress(db)) {
      throw new Error("Database is in an invalid state: ingestion in progress flag is set");
    }

    // Verify we can get the rainbow record count
    const countResponse = await server.labelCount();
    if (countResponse.status === StatusCode.Error) {
      throw new Error(
        `Database is in an invalid state: failed to get rainbow record count: ${countResponse.error}`,
      );
    }

    return server;
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
      } satisfies HealBadRequestError;
    }

    try {
      const label = await safeGet(this.db, labelHashBytes);
      if (label === null) {
        this.logger.info(`Unhealable labelhash request: ${labelhash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies HealNotFoundError;
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
      } satisfies HealServerError;
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
        } satisfies CountServerError;
      }

      const count = parseNonNegativeInteger(countStr);
      if (count === null) {
        this.logger.error(`Invalid label count value in database: ${countStr}`);
        return {
          status: StatusCode.Error,
          error: "Internal server error: Invalid label count format",
          errorCode: ErrorCode.ServerError,
        } satisfies CountServerError;
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
      } satisfies CountServerError;
    }
  }
}
