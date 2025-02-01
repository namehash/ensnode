import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import { Hex } from "viem";
import { labelHashToBytes } from "./utils/label-utils";
import { LABELHASH_COUNT_KEY } from "./utils/constants";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const INPUT_FILE = process.env.INPUT_FILE || join(process.cwd(), "ens_names.sql.gz");

// Total number of expected records in the ENS rainbow table SQL dump
// This number represents the count of unique label-labelhash pairs
// as of January 30, 2024 from the Graph Protocol's ENS rainbow tables
// Source file: ens_names.sql.gz
// SHA256: a6316b1e7770b1f3142f1f21d4248b849a5c6eb998e3e66336912c9750c41f31
const TOTAL_EXPECTED_RECORDS = 133_856_894;

async function loadEnsNamesToLevelDB(): Promise<void> {
  // Initialize LevelDB with proper types for key and value
  const db = new ClassicLevel<Buffer, string>(DATA_DIR, {
    valueEncoding: "utf8",
    keyEncoding: "binary",
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
  const seenLabelHashes = new Set<string>();

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

    const parts = line.trim().split("\t");
    if (parts.length !== 2) {
      console.warn(`Invalid line format - expected 2 columns but got ${parts.length}: "${line.slice(0, 100)}"`);
      continue;
    }

    const [labelHash, label] = parts;
    let labelHashBytes: Buffer;
    try {
      labelHashBytes = labelHashToBytes(labelHash as Hex);
      const labelHashHex = labelHashBytes.toString('hex');
      
      if (seenLabelHashes.has(labelHashHex)) {
        continue;
      }
      
    //   seenLabelHashes.add(labelHashHex);
      batch.put(labelHashBytes, label);
      batchSize++;
      processedRecords++;

      if (batchSize >= MAX_BATCH_SIZE) {
        batch.put(LABELHASH_COUNT_KEY, processedRecords.toString());
        await batch.write();
        batch = db.batch();
        batchSize = 0;
      }
      bar.tick();
    } catch (e) {
      if (e instanceof Error) {
        console.warn(`Error processing hash: ${e.message} '${labelHash}'`);
      } else {
        console.warn(`Unknown error processing hash: '${labelHash}'`);
      }
      continue;
    }
  }

  // Write any remaining entries
  if (batchSize > 0) {
    batch.put(LABELHASH_COUNT_KEY, processedRecords.toString());
    await batch.write();
  }

  await db.close();
  console.log("\nData ingestion complete!");
  
  // Validate the number of processed records
  if (processedRecords !== TOTAL_EXPECTED_RECORDS) {
    console.warn(`Warning: Expected ${TOTAL_EXPECTED_RECORDS} records but processed ${processedRecords}`);
  } else {
    console.log(`Successfully ingested all ${processedRecords} records`);
  }
  console.log(`Total unique labels stored: ${seenLabelHashes.size}`);
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnsNamesToLevelDB()
    .then(() => console.log("Done!"))
    .catch(console.error);
}
