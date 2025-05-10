import { type EnsRainbow, ErrorCode, StatusCode, labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";

import { ENSRainbowDB } from "@/lib/database";
import { logger } from "@/utils/logger";
import { LabelHash } from "@ensnode/utils";

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

  async heal(
    labelHash: LabelHash,
    highest_label_set: number = Number.MAX_SAFE_INTEGER,
  ): Promise<EnsRainbow.HealResponse> {
    let labelHashBytes: ByteArray;
    try {
      labelHashBytes = labelHashToBytes(labelHash);
    } catch (error) {
      const defaultErrorMsg = "Invalid labelHash - must be a valid hex string";
      return {
        status: StatusCode.Error,
        error: (error as Error).message ?? defaultErrorMsg,
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      const label = await this.db.getLabel(labelHashBytes);
      if (label === null) {
        logger.info(`Unhealable labelHash request: ${labelHash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      // Check if the label has a label set prefix
      // Format expected: "labelSetNumber:actualLabel"
      // Only split by the first colon
      const firstColonIndex = label.indexOf(":");

      // If there's no colon or it's the first character, the format is invalid
      if (firstColonIndex <= 0) {
        logger.error(`Invalid label format (missing set number prefix): "${label}"`);
        return {
          status: StatusCode.Error,
          error: "Internal server error",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.HealError;
      }

      // Extract the label set number and the actual label
      const labelSetStr = label.substring(0, firstColonIndex);
      const actualLabel = label.substring(firstColonIndex + 1);

      // Parse the label set number
      const labelSetNumber = parseInt(labelSetStr, 10);
      if (isNaN(labelSetNumber)) {
        logger.error(`Invalid label set number: "${labelSetStr}"`);
        return {
          status: StatusCode.Error,
          error: "Internal server error",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.HealError;
      }

      // Only return the label if its set number is less than or equal to highest_label_set
      if (labelSetNumber > highest_label_set) {
        logger.info(
          `Label set ${labelSetNumber} for ${labelHash} exceeds highest_label_set ${highest_label_set}`,
        );
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      logger.info(
        `Successfully healed labelHash ${labelHash} to label "${actualLabel}" (set ${labelSetNumber})`,
      );
      return {
        status: StatusCode.Success,
        label: actualLabel,
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
      const precalculatedCount = await this.db.getPrecalculatedRainbowRecordCount();
      if (precalculatedCount === null) {
        return {
          status: StatusCode.Error,
          error:
            "Precalculated rainbow record count not initialized. Check that the ingest command has been run.",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.CountServerError;
      }

      return {
        status: StatusCode.Success,
        count: precalculatedCount,
        timestamp: new Date().toISOString(),
      } satisfies EnsRainbow.CountSuccess;
    } catch (error) {
      logger.error("Failed to retrieve precalculated rainbow record count:", error);
      return {
        status: StatusCode.Error,
        error: "Label count not initialized. Check the validate command.",
        errorCode: ErrorCode.ServerError,
      } satisfies EnsRainbow.CountServerError;
    }
  }
}
