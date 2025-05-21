import { type EnsRainbow, ErrorCode, StatusCode, labelHashToBytes } from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";

import { ENSRainbowDB } from "@/lib/database";
import { logger } from "@/utils/logger";
import { LabelHash } from "@ensnode/utils";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;
  private namespace!: string;
  private highestLabelSet!: number;

  private constructor(db: ENSRainbowDB) {
    this.db = db;
    // Namespace and highest label set will be set in init
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

    server.namespace = await db.getNamespace();
    server.highestLabelSet = await db.getHighestLabelSet();

    return server;
  }

  async heal(
    labelHash: LabelHash,
    highestLabelSet: number = Number.MAX_SAFE_INTEGER,
    namespace?: string,
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
      // If namespace was provided, verify it matches the database namespace
      if (namespace !== undefined) {
        if (namespace !== this.namespace) {
          logger.info(`Namespace mismatch: requested=${namespace}, actual=${this.namespace}`);
          return {
            status: StatusCode.Error,
            error: "Namespace mismatch",
            errorCode: ErrorCode.BadRequest,
          } satisfies EnsRainbow.HealError;
        }

        // Verify that the highest_label_set is not greater than the current label set
        if (highestLabelSet > this.highestLabelSet) {
          logger.info(
            `Requested label set ${highestLabelSet} is higher than current label set ${this.highestLabelSet}`,
          );
          return {
            status: StatusCode.Error,
            error: "Requested label set is higher than available label set",
            errorCode: ErrorCode.BadRequest,
          } satisfies EnsRainbow.HealError;
        }
      }

      const label = await this.db.getLabel(labelHashBytes);
      if (label === null) {
        logger.info(`Unhealable labelHash request: ${labelHash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      const { labelSet: labelSetNumber, label: actualLabel } = label;

      // Only return the label if its label set number is less than or equal to highest_label_set
      if (labelSetNumber > highestLabelSet) {
        logger.info(
          `Label set ${labelSetNumber} for ${labelHash} exceeds highest_label_set ${highestLabelSet}`,
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
