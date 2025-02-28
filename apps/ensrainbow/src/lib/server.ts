import { type EnsRainbow, ErrorCode, StatusCode, labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";
import { logger } from "../utils/logger";
import { ENSRainbowDB } from "./database";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;

  private constructor(db: ENSRainbowDB) {
    this.db = db;
  }

  /**
   * Creates a new ENSRainbowServer instance
   * @param db The ENSRainbowDB instance
   * @param logLevel Optional log level
   * @throws Error if a "lite" validation of the database fails
   */
  public static async init(db: ENSRainbowDB): Promise<ENSRainbowServer> {
    const server = new ENSRainbowServer(db);

    if (!(await db.validate({ lite: true }))) {
      throw new Error("Database is in an invalid state");
    }

    return server;
  }

  async heal(labelhash: `0x${string}`): Promise<EnsRainbow.HealResponse> {
    let labelHashBytes: ByteArray;
    try {
      labelHashBytes = labelHashToBytes(labelhash);
    } catch (error) {
      const defaultErrorMsg = "Invalid labelhash - must be a valid hex string";
      return {
        status: StatusCode.Error,
        error: (error as Error).message ?? defaultErrorMsg,
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      const label = await this.db.get(labelHashBytes);
      if (label === null) {
        logger.info(`Unhealable labelhash request: ${labelhash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      logger.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
      return {
        status: StatusCode.Success,
        label,
      } satisfies EnsRainbow.HealSuccess;
    } catch (error) {
      logger.error("Error healing label:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies EnsRainbow.HealError;
    }
  }

  async labelCount(): Promise<EnsRainbow.CountResponse> {
    try {
      const count = await this.db.getPrecalculatedRainbowRecordCount();
      if (count === null) {
        return {
          status: StatusCode.Error,
          error: "Label count not initialized. Check that the ingest command has been run.",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.CountServerError;
      }

      return {
        status: StatusCode.Success,
        count,
        timestamp: new Date().toISOString(),
      } satisfies EnsRainbow.CountSuccess;
    } catch (error) {
      logger.error("Failed to retrieve label count:", error);
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies EnsRainbow.CountServerError;
    }
  }
}
