import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import { ByteArray } from "viem";
import { buildRainbowRecord } from "./utils/rainbow-record";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const INPUT_FILE = process.env.INPUT_FILE || join(process.cwd(), "ens_names.sql.gz");

// Total number of expected records in the ENS rainbow table SQL dump
// This number represents the count of unique label-labelhash pairs
// as of January 30, 2024 from the Graph Protocol's ENS rainbow tables
// Source file: ens_names.sql.gz
// SHA256: a6316b1e7770b1f3142f1f21d4248b849a5c6eb998e3e66336912c9750c41f31
// Note: The input file contains one known invalid record at line 10878 
// where the labelhash value is literally "hash". This record is skipped
// during ingestion since it would be unreachable through the ENS Subgraph anyway.
// See: https://github.com/namehash/ensnode/issues/140
const TOTAL_EXPECTED_RECORDS = 133_856_894;

async function loadEnsNamesToLevelDB(): Promise<void> {
  // Initialize LevelDB with proper types for key and value
  const db = new ClassicLevel<ByteArray, string>(DATA_DIR, {
    keyEncoding: "binary",
    valueEncoding: "utf8",
  });

  // Clear existing database before starting
  console.log("Clearing existing database...");
  await db.clear();
  console.log("Database cleared.");

  const bar = new ProgressBar(
    "Processing [:bar] :current/:total lines (:percent) - :rate lines/sec - :etas remaining",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: TOTAL_EXPECTED_RECORDS,
    },
  );

  // Create a read stream for the gzipped file
  const fileStream = createReadStream(INPUT_FILE);
  const gunzip = createGunzip();
  const rl = createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity,
  });

  let isCopySection = false;
  let batch = db.batch();
  let batchSize = 0;
  let processedRecords = 0;
  const MAX_BATCH_SIZE = 10000;

  console.log("Loading data into LevelDB...");

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
        console.warn(`Skipping invalid record: ${e.message} - this record would be unreachable via ENS Subgraph`);
      } else {
        console.warn(`Unknown error processing record - skipping`);
      }
      continue;
    }

    batch.put(record.labelHash, record.label);
    batchSize++;
    processedRecords++;

    if (batchSize >= MAX_BATCH_SIZE) {
      await batch.write();
      batch = db.batch();
      batchSize = 0;
    }
    bar.tick();
  }

  // Write any remaining entries
  if (batchSize > 0) {
    await batch.write();
  }

  await db.close();
  console.log("\nData ingestion complete!");

  // Validate the number of processed records
  if (processedRecords !== TOTAL_EXPECTED_RECORDS) {
    console.warn(
      `Warning: Expected ${TOTAL_EXPECTED_RECORDS} records but processed ${processedRecords}`,
    );
  } else {
    console.log(`Successfully ingested all ${processedRecords} records`);
  }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnsNamesToLevelDB()
    .then(() => console.log("Done!"))
    .catch(console.error);
}
