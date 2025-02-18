import { type EnsRainbow, ErrorCode, StatusCode, labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";
import { logger } from "../utils/logger";
import { ENSRainbowDB, LABELHASH_COUNT_KEY, parseNonNegativeInteger } from "./database";

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

    // Verify that the attached db fully completed its ingestion (ingestion not interrupted)
    if (await db.isIngestionInProgress()) {
      const errorMessage =
        "Database is in an incomplete state! " +
        "An ingestion was started but not completed successfully.\n" +
        "To fix this:\n" +
        "1. Delete the data directory\n" +
        "2. Run the ingestion command again: ensrainbow ingest <input-file>";
      logger.error(errorMessage);
      throw new Error(errorMessage);
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
      const countStr = await this.db.get(LABELHASH_COUNT_KEY);
      if (countStr === null) {
        return {
          status: StatusCode.Error,
          error: "Label count not initialized. Check that the ingest command has been run.",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.CountServerError;
      }

      const count = parseNonNegativeInteger(countStr);
      if (count === null) {
        logger.error(`Invalid label count value in database: ${countStr}`);
        return {
          status: StatusCode.Error,
          error: "Internal server error: Invalid label count format",
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
