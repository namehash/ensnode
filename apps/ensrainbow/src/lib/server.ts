import {
  type EnsRainbow,
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  ErrorCode,
  type LabelSetId,
  type LabelSetVersion,
  StatusCode,
  labelHashToBytes,
  validateSupportedLabelSetAndVersion,
} from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";

import { ENSRainbowDB } from "@/lib/database";
import { logger } from "@/utils/logger";
import { LabelHash } from "@ensnode/ensnode-sdk";

export class ENSRainbowServer {
  private readonly db: ENSRainbowDB;
  private readonly serverLabelSet: EnsRainbowServerLabelSet;

  private constructor(db: ENSRainbowDB, serverLabelSet: EnsRainbowServerLabelSet) {
    this.db = db;
    this.serverLabelSet = serverLabelSet;
  }

  /**
   * Creates a new ENSRainbowServer instance
   * @param db The ENSRainbowDB instance
   * @param logLevel Optional log level
   * @throws Error if a "lite" validation of the database fails
   */
  public static async init(db: ENSRainbowDB): Promise<ENSRainbowServer> {
    if (!(await db.validate({ lite: true }))) {
      throw new Error("Database is in an invalid state");
    }

    const serverLabelSet = await db.getLabelSet();

    return new ENSRainbowServer(db, serverLabelSet);
  }

  /**
   * Returns the full server label set object
   * @returns The server's label set configuration
   */
  public getServerLabelSet(): EnsRainbowServerLabelSet {
    return this.serverLabelSet;
  }

  async heal(
    labelHash: LabelHash,
    clientLabelSet: EnsRainbowClientLabelSet,
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
      validateSupportedLabelSetAndVersion(this.serverLabelSet, clientLabelSet);
    } catch (error) {
      logger.info((error as Error).message);
      return {
        status: StatusCode.Error,
        error: (error as Error).message,
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      const versionedRainbowRecord = await this.db.getVersionedRainbowRecord(labelHashBytes);
      if (versionedRainbowRecord === null) {
        logger.info(`Unhealable labelHash request: ${labelHash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      const { labelSetVersion: labelSetVersionNumber, label: actualLabel } = versionedRainbowRecord;

      // Only return the label if its label set version is less than or equal to the client's requested labelSetVersion
      if (
        clientLabelSet.labelSetVersion !== undefined &&
        labelSetVersionNumber > clientLabelSet.labelSetVersion
      ) {
        logger.info(
          `Label set version ${labelSetVersionNumber} for ${labelHash} exceeds client's requested label set version ${clientLabelSet.labelSetVersion}`,
        );
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      logger.info(
        `Successfully healed labelHash ${labelHash} to label "${actualLabel}" (set ${labelSetVersionNumber})`,
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
