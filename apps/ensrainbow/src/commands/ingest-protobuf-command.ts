import { createReadStream } from "fs";
import ProgressBar from "progress";
import protobuf from "protobufjs";
import { ByteArray } from "viem";

import { CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION } from "@/commands/convert-command";
import { ENSRainbowDB, IngestionStatus } from "@/lib/database";
import { logger } from "@/utils/logger";
import { createRainbowProtobufRoot } from "@/utils/protobuf-schema";
import {
  type LabelSetId,
  type LabelSetVersion,
  buildLabelSetId,
  buildLabelSetVersion,
} from "@ensnode/ensrainbow-sdk";

export interface IngestProtobufCommandOptions {
  inputFile: string;
  dataDir: string;
}

/**
 * Ingests rainbow tables from protobuf format into LevelDB
 * Handles a stream of length-prefixed (delimited) protobuf messages
 *
 * This format is compatible with standard protobuf implementations across
 * different platforms and languages.
 */
export async function ingestProtobufCommand(options: IngestProtobufCommandOptions): Promise<void> {
  const db = await ENSRainbowDB.openOrCreate(options.dataDir);

  try {
    // Check the current ingestion status
    let ingestionStatus: IngestionStatus;
    try {
      ingestionStatus = await db.getIngestionStatus();
    } catch (e) {
      const errorMessage =
        "Database is in an unknown state!\n" +
        "To fix this:\n" +
        "1. Delete the data directory\n" +
        "2. Run the ingestion command again: ensrainbow ingest-ensrainbow <input-file>";
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (ingestionStatus === IngestionStatus.Unfinished) {
      const errorMessage =
        "Database is in an incomplete state! " +
        "An ingestion was started but not finished successfully.\n" +
        "To fix this:\n" +
        "1. Delete the data directory\n" +
        "2. Run the ingestion command again: ensrainbow ingest-ensrainbow <input-file>";
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (ingestionStatus === IngestionStatus.Finished) {
      // const errorMessage =
      //   "ENSRainbow currently only supports a single ingestion. We're working to enhance this soon!\n" +
      //   "If you want to re-ingest data:\n" +
      //   "1. Delete the data directory\n" +
      //   "2. Run the ingestion command again: ensrainbow ingest-ensrainbow <input-file>";
      // logger.error(errorMessage);
      // throw new Error(errorMessage);
      logger.info("Ingestion to already pre-existing database.");
    }

    // Values that will be read from the file header
    let fileVersion = 0;
    let fileLabelSetId: LabelSetId;
    let fileLabelSetVersion: LabelSetVersion;

    // Create a way to reject the command from event handlers
    let commandReject: (reason: Error) => void;
    const commandPromise = new Promise<void>((_, reject) => {
      commandReject = reject;
    });

    logger.info("Starting ingestion from protobuf file...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Data directory: ${options.dataDir}`);
    logger.info("Version, Label Set ID and Label Set Version will be read from file header");

    // Set up protobuf parser - need both record and collection types
    const { RainbowRecordType, RainbowRecordCollectionType } = createRainbowProtobufRoot();

    // Prepare the database batch
    let batch = db.batch();
    let batchSize = 0;
    let processedRecords = 0;
    const MAX_BATCH_SIZE = 10000;
    const writePromises: Promise<void>[] = []; // To track batch write promises

    // Create a read stream for the protobuf file
    const fileStream = createReadStream(options.inputFile);

    // We'll accumulate bytes until we have a complete message
    let buffer = Buffer.alloc(0);
    let headerRead = false; // Flag to track if header is read

    // Set up a progress bar
    const bar = new ProgressBar(
      "Ingesting [:bar] :current records - :rate records/sec - :elapsed elapsed",
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: 1000000000, // Placeholder total
      },
    );

    logger.info("Reading protobuf data (header first, then records)...");

    // Set up the file stream handler
    fileStream.on("data", (chunk) => {
      // Append this chunk to our buffer
      buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

      // Process as many complete delimited messages as possible from the buffer
      let bytesRead = 0;

      try {
        // --- Read Header (if not already read) ---
        if (!headerRead) {
          try {
            const reader = protobuf.Reader.create(buffer.subarray(bytesRead));
            // Use decodeDelimited to read the header collection message
            const headerCollection = RainbowRecordCollectionType.decodeDelimited(reader);
            const headerLength = reader.pos;

            // Process the header
            const headerObj = RainbowRecordCollectionType.toObject(headerCollection, {
              bytes: Buffer.from,
              defaults: true,
            });

            fileVersion = headerObj.ensrainbow_file_format_version;
            try {
              fileLabelSetId = buildLabelSetId(headerObj.label_set_id);
            } catch (e) {
              const msg = `Invalid label set ID in file header: ${(e as Error).message}`;
              logger.error(msg);
              fileStream.destroy(new Error(msg)); // Stop processing
              return;
            }
            try {
              fileLabelSetVersion = buildLabelSetVersion(headerObj.label_set_version);
            } catch (e) {
              const msg = `Invalid label set version in file header: ${(e as Error).message}`;
              logger.error(msg);
              fileStream.destroy(new Error(msg)); // Stop processing
              return;
            }

            // Validate version
            if (fileVersion !== CURRENT_ENSRAINBOW_FILE_FORMAT_VERSION) {
              const msg = `.ensrainbow File format version ${fileVersion} is not supported. Update your application to the latest version.`;
              logger.error(msg);
              fileStream.destroy(new Error(msg)); // Stop processing
              return;
            }

            // Log header info
            logger.info(
              `Read header: Version=${fileVersion}, Label Set ID=${fileLabelSetId}, Label Set Version=${fileLabelSetVersion}`,
            );

            // Validate header against database state
            logger.info(
              `Read header: Label Set ID=${fileLabelSetId}, Label Set Version=${fileLabelSetVersion}`,
            );

            // Validate the label set
            if (ingestionStatus === IngestionStatus.Unstarted) {
              if (fileLabelSetVersion !== 0) {
                const msg = `Initial ingestion must use a file with label set version 0, but file has label set version ${fileLabelSetVersion}!`;
                logger.error(msg);
                fileStream.destroy(new Error(msg)); // Stop processing
                return;
              }
            } else {
              // For existing db, we need to validate label set id and label set version
              // Using .then() as we are inside a sync event handler
              db.getLabelSet()
                .then((currentLabelSet) => {
                  if (currentLabelSet.labelSetId !== fileLabelSetId) {
                    const msg = `Label set id mismatch! Database label set id: ${currentLabelSet.labelSetId}, File label set id: ${fileLabelSetId}!`;
                    logger.error(msg);
                    fileStream.destroy(new Error(msg)); // Stop processing
                    commandReject(new Error(msg));
                    return;
                  }

                  if (fileLabelSetVersion !== currentLabelSet.highestLabelSetVersion + 1) {
                    const msg =
                      `Label set version must be exactly one higher than the current highest label set version.\n` +
                      `Current highest label set version: ${currentLabelSet.highestLabelSetVersion}, File label set version: ${fileLabelSetVersion}`;
                    logger.error(msg);
                    fileStream.destroy(new Error(msg)); // Stop processing
                    commandReject(new Error(msg));
                    return;
                  }
                })
                .catch((err) => {
                  logger.error(`Failed to get label set: ${err}`);
                  fileStream.destroy(err);
                });
            }

            // If this is the first ingestion, set the label set id in the DB
            if (ingestionStatus === IngestionStatus.Unstarted) {
              // Using .then() as we are inside a sync event handler
              db.setLabelSetId(fileLabelSetId)
                .then(() => {
                  logger.info(
                    `Initialized database label set id to: ${fileLabelSetId} from header.`,
                  );
                  return db.setHighestLabelSetVersion(0);
                })
                .then(() => {
                  // Initial set is 0
                  logger.info("Initialized highest label set version to: 0");
                  // Mark ingestion as started after initialization
                  return db.markIngestionUnfinished();
                })
                .then(() => {
                  logger.info("Marked ingestion as unfinished");
                })
                .catch((err) => {
                  logger.error(`Failed during initialization: ${err}`);
                  fileStream.destroy(err);
                });
            } else {
              // For existing db, validate label set id and label set version before marking as unfinished
              db.getLabelSet()
                .then((currentLabelSet) => {
                  if (currentLabelSet.labelSetId !== fileLabelSetId) {
                    const msg = `Label set id mismatch! Database label set id: ${currentLabelSet.labelSetId}, File label set id: ${fileLabelSetId}!`;
                    logger.error(msg);
                    fileStream.destroy(new Error(msg)); // Stop processing
                    commandReject(new Error(msg));
                    return;
                  }

                  if (fileLabelSetVersion !== currentLabelSet.highestLabelSetVersion + 1) {
                    const msg =
                      `Label set version must be exactly one higher than the current highest label set version.\n` +
                      `Current highest label set version: ${currentLabelSet.highestLabelSetVersion}, File label set version: ${fileLabelSetVersion}`;
                    logger.error(msg);
                    fileStream.destroy(new Error(msg)); // Stop processing
                    commandReject(new Error(msg));
                    return;
                  }

                  // Only mark as unfinished if validation passes
                  return db.markIngestionUnfinished();
                })
                .then(() => {
                  logger.info("Marked ingestion as unfinished");
                })
                .catch((err) => {
                  if (
                    !err.message?.includes("Label set id mismatch") &&
                    !err.message?.includes("Label set version must be exactly")
                  ) {
                    logger.error(`Failed during validation: ${err}`);
                    fileStream.destroy(err);
                  }
                });
            }

            headerRead = true;
            bytesRead += headerLength;
            logger.info("Header processed successfully. Reading records...");
          } catch (e) {
            // If we can't decode the header yet, we need more data
            // Don't proceed to read records until header is done
            return;
          }
        }
        // --- End Header Read ---

        // --- Read Records (only after header is read) ---
        while (headerRead && bytesRead < buffer.length) {
          try {
            const reader = protobuf.Reader.create(buffer.subarray(bytesRead));
            // Use decodeDelimited to read a length-prefixed RainbowRecord message
            const message = RainbowRecordType.decodeDelimited(reader);
            const messageLength = reader.pos;

            // Process the record
            const record = RainbowRecordType.toObject(message, {
              bytes: Buffer.from,
              defaults: true,
            });

            // Make sure we have a proper buffer for the labelHash
            let labelHashBuffer: Buffer;
            if (Buffer.isBuffer(record.labelhash)) {
              labelHashBuffer = record.labelhash;
            } else {
              labelHashBuffer = Buffer.from(record.labelhash);
            }

            // Prefix the label with the actual label set version number from the header
            const prefixedLabel = `${fileLabelSetVersion}:${String(record.label)}`;

            // Add to database batch
            batch.put(labelHashBuffer as ByteArray, prefixedLabel);
            batchSize++;
            processedRecords++;

            // Write batch if needed
            if (batchSize >= MAX_BATCH_SIZE) {
              const writePromise = batch.write().catch((err) => {
                logger.error(`Error writing batch: ${err}`);
                fileStream.destroy(err);
                throw err;
              });
              writePromises.push(writePromise);
              batch = db.batch();
              batchSize = 0;
            }

            // Update progress
            bar.tick();

            // Move to the next message
            bytesRead += messageLength;
          } catch (e) {
            // If we can't decode a record message, we need more data
            break;
          }
        }
        // --- End Record Read ---

        // Keep any partial message data for the next chunk
        if (bytesRead > 0) {
          buffer = buffer.subarray(bytesRead);
        }
      } catch (e) {
        // Catch errors during the processing loop
        logger.error(`Error processing protobuf data chunk: ${e}`);
        fileStream.destroy(e instanceof Error ? e : new Error(String(e)));
      }
    });

    // Wait for the stream to finish
    await Promise.race([
      commandPromise,
      new Promise<void>((resolve, reject) => {
        fileStream.on("end", async () => {
          try {
            // Check if header was ever read
            if (!headerRead) {
              throw new Error(
                "Stream finished but header message was not found or was incomplete.",
              );
            }

            // Wait for any outstanding batch writes from the 'data' event handler to complete
            // mitigates race condition
            await Promise.all(writePromises);

            // Write any remaining entries
            if (batchSize > 0) {
              await batch.write();
            }

            logger.info("\nIngestion from protobuf file complete!");
            logger.info(`Successfully ingested ${processedRecords} records`);

            // Run count as second phase
            logger.info("\nStarting rainbow record counting phase...");
            const count = await db.countRainbowRecords();
            await db.setPrecalculatedRainbowRecordCount(count);

            // Update the highest label set version with the one from the file header
            await db.setHighestLabelSetVersion(fileLabelSetVersion);
            logger.info(`Updated highest label set version to: ${fileLabelSetVersion}`);

            // Mark ingestion as finished
            await db.markIngestionFinished();

            logger.info("Data ingestion and count verification complete!");
            resolve();
          } catch (error) {
            logger.error(`Error during stream end processing: ${error}`);
            // Ensure ingestion is marked as unfinished on error
            // db.markIngestionUnfinished().finally(() => reject(error));
            reject(error);
          }
        });

        fileStream.on("error", (error) => {
          logger.error(`Error reading input file stream: ${error}`);
          // Ensure ingestion is marked as unfinished on stream error
          // db.markIngestionUnfinished().finally(() => reject(error));
          reject(error);
        });
      }),
    ]);
  } catch (error) {
    logger.error(`Ingestion failed: ${error}`);
    // Attempt to mark as unfinished if an error occurred before stream processing finished
    // await db
    //   .markIngestionUnfinished()
    //   .catch((err) =>
    //     logger.error(`Failed to mark ingestion as unfinished on final error: ${err}`),
    //   );
    throw error;
  } finally {
    await db.close();
    logger.info("Database connection closed.");
  }
}
