import { createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import { createGunzip } from "zlib";
import { ClassicLevel } from "classic-level";
import ProgressBar from "progress";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const INPUT_FILE = process.env.INPUT_FILE || join(process.cwd(), "ens_names.sql.gz");

async function loadEnsNamesToLevelDB(): Promise<void> {
  // Initialize LevelDB with proper types for key and value
  const db = new ClassicLevel<Buffer, string>(DATA_DIR, {
    valueEncoding: "utf8",
    keyEncoding: "binary",
  });

  // Total number of lines in the ENS rainbow table SQL dump
  // This number represents the count of unique label-labelhash pairs
  // as of January 30, 2024 from the Graph Protocol's ENS rainbow tables
  // Source file: ens_names.sql.gz
  // SHA256: a6316b1e7770b1f3142f1f21d4248b849a5c6eb998e3e66336912c9750c41f31
  const TOTAL_LINES = 133_856_894;
  const bar = new ProgressBar(
    "Processing [:bar] :current/:total lines (:percent) - :rate lines/sec - :etas remaining",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: TOTAL_LINES,
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

    if (isCopySection) {
      const parts = line.trim().split("\t");
      if (parts.length === 2) {
        const [hashVal, name] = parts;
        if (hashVal && name) {
          try {
            // Convert hex string to Buffer, stripping '0x' prefix
            const hashBytes = Buffer.from(hashVal.slice(2), "hex");
            batch.put(hashBytes, name);
            batchSize++;

            if (batchSize >= MAX_BATCH_SIZE) {
              await batch.write();
              batch = db.batch();
              batchSize = 0;
            }
            bar.tick();
          } catch (e) {
            console.error(`Error processing hash: ${e} '${hashVal}'`);
          }
        }
      }
    }
  }

  // Write any remaining entries
  if (batchSize > 0) {
    await batch.write();
  }

  await db.close();
  console.log("\nData loading complete!");
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadEnsNamesToLevelDB()
    .then(() => console.log("Done!"))
    .catch(console.error);
}
