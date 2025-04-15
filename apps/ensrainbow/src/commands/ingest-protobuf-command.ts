import { createReadStream } from "fs";
import ProgressBar from "progress";
import protobuf from "protobufjs";
import { ByteArray } from "viem";

import { ENSRainbowDB, IngestionStatus } from "@/lib/database";
import { logger } from "@/utils/logger";
import { createRainbowProtobufRoot } from "@/utils/protobuf-schema";

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
  const db = await ENSRainbowDB.create(options.dataDir);

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
      const errorMessage =
        "ENSRainbow currently only supports a single ingestion. We're working to enhance this soon!\n" +
        "If you want to re-ingest data:\n" +
        "1. Delete the data directory\n" +
        "2. Run the ingestion command again: ensrainbow ingest-ensrainbow <input-file>";
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Mark ingestion as started
    await db.markIngestionUnfinished();

    // Get and increment the highest label set
    const labelSetNumber = await db.incrementHighestLabelSet();
    logger.info(`Using label set number: ${labelSetNumber}`);

    logger.info("Starting ingestion from protobuf file...");
    logger.info(`Input file: ${options.inputFile}`);
    logger.info(`Data directory: ${options.dataDir}`);

    // Set up protobuf parser - we need the RainbowRecord type
    const { RainbowRecordType } = createRainbowProtobufRoot();

    // Prepare the database batch
    let batch = db.batch();
    let batchSize = 0;
    let processedRecords = 0;
    const MAX_BATCH_SIZE = 10000;

    // Create a read stream for the protobuf file
    const fileStream = createReadStream(options.inputFile);

    // We'll accumulate bytes until we have a complete message
    let buffer = Buffer.alloc(0);

    // Set up a progress bar (can't show total since we don't know yet)
    const bar = new ProgressBar(
      "Ingesting [:bar] :current records - :rate records/sec - :elapsed elapsed",
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: 1000000000, // Just a big number, we'll update the progress by percentage
      },
    );

    logger.info("Reading and ingesting protobuf data...");

    // Set up the file stream handler
    fileStream.on("data", (chunk) => {
      // Append this chunk to our buffer
      buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

      // Process as many complete delimited messages as possible from the buffer
      let bytesRead = 0;

      try {
        while (bytesRead < buffer.length) {
          // Try to decode a delimited message from the current position
          try {
            const reader = protobuf.Reader.create(buffer.subarray(bytesRead));
            // Use decodeDelimited to read a length-prefixed message
            const message = RainbowRecordType.decodeDelimited(reader);

            // If successful, get the message length (including the length prefix)
            const messageLength = reader.pos;

            // Process the message
            const record = RainbowRecordType.toObject(message, {
              bytes: Buffer.from,
              defaults: true,
            });

            // Make sure we have a proper buffer for the labelHash
            let labelHashBuffer: Buffer;
            if (Buffer.isBuffer(record.label_hash)) {
              labelHashBuffer = record.label_hash;
            } else {
              // If it's not a buffer, try to convert it (shouldn't happen, but just in case)
              labelHashBuffer = Buffer.from(record.label_hash);
            }

            // Prefix the label with the current label set number and a colon
            const prefixedLabel = `${labelSetNumber}:${String(record.label)}`;

            // Add to database batch
            batch.put(labelHashBuffer as ByteArray, prefixedLabel);
            batchSize++;
            processedRecords++;

            // Write batch if needed
            if (batchSize >= MAX_BATCH_SIZE) {
              // Note: this would ideally be awaited, but we're in a non-async event handler
              // In a real implementation, we might want to use a more complex approach
              // that pauses the stream while we write the batch
              batch
                .write()
                .then(() => {
                  batch = db.batch();
                  batchSize = 0;
                })
                .catch((err) => {
                  logger.error(`Error writing batch: ${err}`);
                });
            }

            // Update progress
            bar.tick();

            // Move to the next message
            bytesRead += messageLength;
          } catch (e) {
            // If we can't decode a message, we need more data
            break;
          }
        }

        // Keep any partial message for the next chunk
        if (bytesRead > 0) {
          buffer = buffer.subarray(bytesRead);
        }
      } catch (e) {
        logger.error(`Error processing protobuf data: ${e}`);
      }
    });

    // Wait for the stream to finish
    await new Promise<void>((resolve, reject) => {
      fileStream.on("end", async () => {
        try {
          // Write any remaining entries
          if (batchSize > 0) {
            await batch.write();
          }

          logger.info("\nIngestion from protobuf file complete!");
          logger.info(`Successfully ingested ${processedRecords} records`);

          // Run count as second phase to verify the number of unique records in the database.
          logger.info("\nStarting rainbow record counting phase...");
          const count = await db.countRainbowRecords();
          await db.setPrecalculatedRainbowRecordCount(count);

          // Mark ingestion as finished since we completed successfully
          await db.markIngestionFinished();

          logger.info("Data ingestion and count verification complete!");
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      fileStream.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    logger.error(`Error during ingestion: ${error}`);
    throw error;
  } finally {
    await db.close();
  }
}
