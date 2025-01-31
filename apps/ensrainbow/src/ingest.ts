import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";
import { Hex, hexToBytes, size, isHex } from "viem";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const INPUT_FILE = process.env.INPUT_FILE || join(process.cwd(), "ens_names.sql.gz");

async function loadEnsNamesToLevelDB(): Promise<void> {
  // Initialize LevelDB with proper types for key and value
  const db = new ClassicLevel<Buffer, string>(DATA_DIR, {
    valueEncoding: "utf8",
    keyEncoding: "binary",
  });

  // Total number of valid records in the ENS rainbow table SQL dump
  // This number represents the count of unique label-labelhash pairs
  // as of January 30, 2024 from the Graph Protocol's ENS rainbow tables
  // Source file: ens_names.sql.gz
  // SHA256: a6316b1e7770b1f3142f1f21d4248b849a5c6eb998e3e66336912c9750c41f31
  const TOTAL_VALID_RECORDS = 133_856_894;
  const bar = new ProgressBar(
    "Processing [:bar] :current/:total lines (:percent) - :rate lines/sec - :etas remaining",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: TOTAL_VALID_RECORDS,
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

    const parts = line.trim().split("\t");
    if (parts.length !== 2) {
      console.warn(`Invalid line format - expected 2 columns but got ${parts.length}: "${line.slice(0, 100)}"`);
      continue;
    }

    const [labelHash, label] = parts;
    if (!label) {
      console.warn(`Missing label for hash ${labelHash}`);
      continue;
    }

    let labelHashBytes: Buffer;
    try {
      labelHashBytes = Buffer.from(hexToBytes(labelHash as Hex));
    } catch (e) {
      console.warn(`Invalid hex format for hash: "${labelHash}"`);
      continue;
    }

    if (labelHashBytes.length !== 32) {
      console.warn(`Invalid hash length ${labelHashBytes.length} bytes (expected 32): "${labelHash}"`);
      continue;
    }

    try {
      batch.put(labelHashBytes, label);
      batchSize++;
      processedRecords++;

      if (batchSize >= MAX_BATCH_SIZE) {
        await batch.write();
        batch = db.batch();
        batchSize = 0;
      }
      bar.tick();
    } catch (e) {
      console.error(`Error processing hash: ${e} '${labelHash}'`);
    }
  }

  // Write any remaining entries
  if (batchSize > 0) {
    await batch.write();
  }

  await db.close();
  console.log("\nData loading complete!");
  
  // Validate the number of processed records
  if (processedRecords !== TOTAL_VALID_RECORDS) {
    console.warn(`Warning: Expected ${TOTAL_VALID_RECORDS} records but processed ${processedRecords}`);
  } else {
    console.log(`Successfully processed all ${processedRecords} records`);
  }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnsNamesToLevelDB()
    .then(() => console.log("Done!"))
    .catch(console.error);
}
