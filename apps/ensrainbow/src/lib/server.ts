import {
  type EnsRainbow,
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  ErrorCode,
  StatusCode,
} from "@ensnode/ensrainbow-sdk";
import { ByteArray } from "viem";

import { ENSRainbowDB } from "@/lib/database";
import { VersionedRainbowRecord } from "@/lib/rainbow-record";
import { getErrorMessage } from "@/utils/error-utils";
import { logger } from "@/utils/logger";
import {
  LabelHash,
  labelHashToBytes,
  validateSupportedLabelSetAndVersion,
} from "@ensnode/ensnode-sdk";

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
    // Using the Factory method pattern to workaround the limitation of Javascript not supporting `await` within a constructor.
    // We do all async work in this `init` function and then make the synchronous call to the constructor when ready.

    if (!(await db.validate({ lite: true }))) {
      throw new Error("Database is in an invalid state");
    }

    const serverLabelSet = await db.getLabelSet();

    return new ENSRainbowServer(db, serverLabelSet);
  }

  /**
   * Returns the server's EnsRainbowServerLabelSet.
   * @returns The server's label set configuration
   */
  public getServerLabelSet(): EnsRainbowServerLabelSet {
    return this.serverLabelSet;
  }

  /**
   * Determines if a versioned rainbow record should be treated as unhealable
   * based on the client's label set version requirements, ignoring the label set ID.
   */
  public static needToSimulateAsUnhealable(
    versionedRainbowRecord: VersionedRainbowRecord,
    clientLabelSet: EnsRainbowClientLabelSet,
  ): boolean {
    // Only return the label if its label set version is less than or equal to the client's requested labelSetVersion
    return (
      clientLabelSet.labelSetVersion !== undefined &&
      versionedRainbowRecord.labelSetVersion > clientLabelSet.labelSetVersion
    );
  }

  async heal(
    labelHash: LabelHash,
    clientLabelSet: EnsRainbowClientLabelSet,
  ): Promise<EnsRainbow.HealResponse> {
    let labelHashBytes: ByteArray;
    try {
      labelHashBytes = labelHashToBytes(labelHash);
    } catch (error) {
      const defaultErrorMsg = "Invalid labelhash - must be a valid hex string";
      return {
        status: StatusCode.Error,
        error: getErrorMessage(error) ?? defaultErrorMsg,
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      validateSupportedLabelSetAndVersion(this.serverLabelSet, clientLabelSet);
    } catch (error) {
      logger.info(getErrorMessage(error));
      return {
        status: StatusCode.Error,
        error: getErrorMessage(error),
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      const versionedRainbowRecord = await this.db.getVersionedRainbowRecord(labelHashBytes);
      if (
        versionedRainbowRecord === null ||
        ENSRainbowServer.needToSimulateAsUnhealable(versionedRainbowRecord, clientLabelSet)
      ) {
        logger.info(`Unhealable labelHash request: ${labelHash}`);
        return {
          status: StatusCode.Error,
          error: "Label not found",
          errorCode: ErrorCode.NotFound,
        } satisfies EnsRainbow.HealError;
      }

      const { labelSetVersion: labelSetVersionNumber, label: actualLabel } = versionedRainbowRecord;

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
