import type { LabelHash } from "enssdk";
import type { ByteArray } from "viem";

import { labelHashToBytes, validateSupportedLabelSetAndVersion } from "@ensnode/ensnode-sdk";
import {
  type EnsRainbow,
  type EnsRainbowClientLabelSet,
  type EnsRainbowServerLabelSet,
  ErrorCode,
  StatusCode,
} from "@ensnode/ensrainbow-sdk";

import type { DbConfig } from "@/config/types";
import { type ENSRainbowDB, NoPrecalculatedCountError } from "@/lib/database";
import type { VersionedRainbowRecord } from "@/lib/rainbow-record";
import { getErrorMessage } from "@/utils/error-utils";
import { logger } from "@/utils/logger";

/**
 * Reads label set and record count from an initialized ENSRainbowServer.
 * @throws Error if the server is not ready or the record count cannot be read from the database.
 */
export async function buildDbConfig(server: ENSRainbowServer): Promise<DbConfig> {
  if (!server.isReady()) {
    throw new Error(
      "Cannot build DB config: ENSRainbowServer has no database attached yet (still bootstrapping)",
    );
  }

  const countResult = await server.labelCount();
  if (countResult.status === StatusCode.Error) {
    throw new Error(
      `Failed to read record count from database: ${countResult.error} (errorCode: ${countResult.errorCode})`,
    );
  }

  // isReady() was true so serverLabelSet is defined.
  return {
    labelSet: server.serverLabelSet as EnsRainbowServerLabelSet,
    recordsCount: countResult.count,
  };
}

/**
 * Thrown when a handler needs the database but the server has not finished bootstrapping yet.
 *
 * HTTP routes map this to a 503 Service Unavailable response so that clients polling `/ready`
 * can retry instead of treating it as a fatal server error.
 */
export class DbNotReadyError extends Error {
  constructor(message = "ENSRainbow is still bootstrapping its database") {
    super(message);
    this.name = "DbNotReadyError";
    Object.setPrototypeOf(this, DbNotReadyError.prototype);
  }
}

export class ENSRainbowServer {
  private db: ENSRainbowDB | undefined;
  private _serverLabelSet: EnsRainbowServerLabelSet | undefined;

  private constructor(db?: ENSRainbowDB, serverLabelSet?: EnsRainbowServerLabelSet) {
    this.db = db;
    this._serverLabelSet = serverLabelSet;
  }

  /**
   * The label set of the attached database. Only defined once the server is ready.
   */
  public get serverLabelSet(): EnsRainbowServerLabelSet | undefined {
    return this._serverLabelSet;
  }

  /**
   * Whether the server has an attached, validated database and is ready to heal labels.
   */
  public isReady(): boolean {
    return this.db !== undefined && this._serverLabelSet !== undefined;
  }

  /**
   * Creates a new ENSRainbowServer instance with an already-opened database.
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
   * Creates a new ENSRainbowServer in a "pending" state without a database attached.
   *
   * The HTTP server can start serving `/health` and `/ready` immediately while a background task
   * downloads and validates the database. Once ready, call {@link attachDb} to transition the
   * server into its ready state.
   */
  public static createPending(): ENSRainbowServer {
    return new ENSRainbowServer();
  }

  /**
   * Attaches a validated database to a previously-pending server instance, making it ready.
   *
   * @throws Error if the server already has a database attached or if the database fails lite validation.
   */
  public async attachDb(db: ENSRainbowDB): Promise<void> {
    if (this.db !== undefined) {
      throw new Error("ENSRainbowServer already has a database attached");
    }

    if (!(await db.validate({ lite: true }))) {
      throw new Error("Database is in an invalid state");
    }

    this._serverLabelSet = await db.getLabelSet();
    this.db = db;
  }

  /**
   * Returns the attached database or throws {@link DbNotReadyError} if not yet ready.
   */
  private requireDb(): ENSRainbowDB {
    if (this.db === undefined) {
      throw new DbNotReadyError();
    }
    return this.db;
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
    const db = this.requireDb();
    const serverLabelSet = this._serverLabelSet as EnsRainbowServerLabelSet;

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
      validateSupportedLabelSetAndVersion(serverLabelSet, clientLabelSet);
    } catch (error) {
      logger.info(getErrorMessage(error));
      return {
        status: StatusCode.Error,
        error: getErrorMessage(error),
        errorCode: ErrorCode.BadRequest,
      } satisfies EnsRainbow.HealError;
    }

    try {
      const versionedRainbowRecord = await db.getVersionedRainbowRecord(labelHashBytes);
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
      logger.error(error, "Error healing label");
      return {
        status: StatusCode.Error,
        error: "Internal server error",
        errorCode: ErrorCode.ServerError,
      } satisfies EnsRainbow.HealError;
    }
  }

  async labelCount(): Promise<EnsRainbow.CountResponse> {
    const db = this.requireDb();
    try {
      const precalculatedCount = await db.getPrecalculatedRainbowRecordCount();
      return {
        status: StatusCode.Success,
        count: precalculatedCount,
        timestamp: new Date().toISOString(),
      } satisfies EnsRainbow.CountSuccess;
    } catch (error) {
      if (error instanceof NoPrecalculatedCountError) {
        return {
          status: StatusCode.Error,
          error:
            "Precalculated rainbow record count not initialized. Check that the ingest command has been run.",
          errorCode: ErrorCode.ServerError,
        } satisfies EnsRainbow.CountServerError;
      }
      logger.error(error, "Failed to retrieve precalculated rainbow record count");
      return {
        status: StatusCode.Error,
        error: "Label count not initialized. Check the validate command.",
        errorCode: ErrorCode.ServerError,
      } satisfies EnsRainbow.CountServerError;
    }
  }

  /**
   * Closes the attached database (if any). Safe to call on a pending server.
   *
   * Flips readiness (`this.db`/`this._serverLabelSet` → `undefined`) BEFORE awaiting the
   * underlying DB close so concurrent handlers checking `isReady()` or calling `requireDb()`
   * see the "not ready" state immediately and don't obtain a handle to a DB that is being
   * torn down. Handlers already past `requireDb()` still hold their local reference, but new
   * ones get a clean `DbNotReadyError` (mapped to 503 at the API layer) instead of racing
   * LevelDB mid-close.
   */
  async close(): Promise<void> {
    const capturedDb = this.db;
    if (capturedDb === undefined) return;
    this.db = undefined;
    this._serverLabelSet = undefined;
    await capturedDb.close();
  }
}
