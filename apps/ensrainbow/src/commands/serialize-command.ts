import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import ProgressBar from "progress";

import { logger } from "@/utils/logger";
import { buildRainbowRecord } from "@/utils/rainbow-record";
import { SerializationFormat, createSerializer } from "@/utils/serializers/serializer-factory";

export interface SerializeCommandOptions {
  inputFile: string;
  outputFile: string;
  format: SerializationFormat;
  limit?: number;
}

export async function serializeCommand(options: SerializeCommandOptions): Promise<void> {
  const { inputFile, outputFile, format, limit } = options;

  // Create the appropriate serializer
  const serializer = createSerializer(format, outputFile);

  try {
    // Create a read stream for the gzipped file
    const fileStream = createReadStream(inputFile);
    const gunzip = createGunzip();
    const rl = createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity,
    });

    let isCopySection = false;
    let processedRecords = 0;
    let invalidRecords = 0;
    const maxRecords = limit || Number.POSITIVE_INFINITY;

    const bar = new ProgressBar(
      `Serializing to ${format} [:bar] :current records (:percent) - :rate records/sec - :etas remaining`,
      {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: maxRecords === Number.POSITIVE_INFINITY ? 1000000 : maxRecords, // Set a reasonable default for infinity
      },
    );

    logger.info(`Starting serialization to ${format} format...`);

    for await (const line of rl) {
      if (line.startsWith("COPY public.ens_names")) {
        isCopySection = true;
        continue;
      }

      if (line.startsWith("\\.")) {
        break;
      }

      if (!isCopySection) {
        continue;
      }

      let record;
      try {
        record = buildRainbowRecord(line);
      } catch (e) {
        if (e instanceof Error) {
          logger.warn(
            `Skipping invalid record: ${e.message} - this record is safe to skip as it would be unreachable by the ENS Subgraph`,
          );
        } else {
          logger.warn(`Unknown error processing record - skipping`);
        }
        invalidRecords++;
        continue;
      }

      await serializer.writeRecord(record);
      processedRecords++;
      bar.tick();

      if (processedRecords >= maxRecords) {
        break;
      }
    }

    logger.info(
      `\nSerialization complete! Created ${outputFile} with ${processedRecords} records.`,
    );
    if (invalidRecords > 0) {
      logger.warn(`Skipped ${invalidRecords} invalid records during processing.`);
    }

    // Close readline interface
    rl.close();

    // Make sure all file handles and resources are fully closed
    fileStream.destroy();
    gunzip.destroy();
  } finally {
    // Ensure the serializer is properly closed to prevent hanging
    await serializer.close();
    logger.info("All resources closed successfully.");
  }
}

export async function deserializeCommand(options: {
  inputFile: string;
  format: SerializationFormat;
  limit?: number;
}): Promise<void> {
  const { inputFile, format, limit } = options;

  // Create the appropriate serializer for reading
  const serializer = createSerializer(format, inputFile);

  try {
    let processedRecords = 0;
    const maxRecords = limit || Number.POSITIVE_INFINITY;

    logger.info(`Starting deserialization from ${format} format...`);

    await serializer.openForReading();

    // Read and process records
    let record = await serializer.readRecord();
    while (record !== null && processedRecords < maxRecords) {
      // Just count the records for validation
      processedRecords++;

      if (processedRecords % 10000 === 0) {
        logger.info(`Processed ${processedRecords} records...`);
      }

      // Get the next record
      record = await serializer.readRecord();

      // Print record
      //   console.log(record);
    }

    logger.info(`\nDeserialization complete! Read ${processedRecords} records from ${inputFile}.`);
  } finally {
    // Ensure we close the serializer completely
    await serializer.close();
    logger.info("All resources closed successfully.");
  }
}
