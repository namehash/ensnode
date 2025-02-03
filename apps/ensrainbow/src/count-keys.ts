import { join } from "path";
import { ClassicLevel } from "classic-level";
import { LABELHASH_COUNT_KEY } from "./utils/constants";
import { ByteArray } from "viem";
import { byteArraysEqual } from "./utils/byte-utils";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");

async function countKeys(): Promise<void> {
  // Initialize LevelDB with same configuration as ingest.ts
  const db = new ClassicLevel<ByteArray, string>(DATA_DIR, {
    valueEncoding: "utf8",
    keyEncoding: "binary",
  });

  // Try to read existing count
  try {
    const existingCount = await db.get(LABELHASH_COUNT_KEY);
    console.log(`Existing count in database: ${existingCount}`);
  } catch (error: any) {
    if (error.code !== 'LEVEL_NOT_FOUND') {
      console.error('Error reading existing count:', error);
    } else {
      console.log('No existing count found in database');
    }
  }

  console.log("Counting keys in database...");
  
  let count = 0;
  for await (const [key] of db.iterator()) {
    // Don't count the count key itself
    if (!byteArraysEqual(key, LABELHASH_COUNT_KEY)) {
      count++;
    }
  }

  // Store the count
  await db.put(LABELHASH_COUNT_KEY, count.toString());
  
  console.log(`Total number of keys (excluding count key): ${count}`);
  console.log(`Updated count in database under LABELHASH_COUNT_KEY`);

  await db.close();
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  countKeys()
    .then(() => console.log("Done!"))
    .catch(console.error);
} 
