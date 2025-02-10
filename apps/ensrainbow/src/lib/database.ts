import { join } from "path";
import { ClassicLevel } from "classic-level";
import { ByteArray } from "viem";

export const getDataDir = () => process.env.DATA_DIR || join(process.cwd(), "data");

export const initializeDatabase = (dataDir: string): ClassicLevel<ByteArray, string> => {
  console.log(`Initializing database with data directory: ${dataDir}`);

  try {
    return new ClassicLevel<ByteArray, string>(dataDir, {
      keyEncoding: "binary",
      valueEncoding: "utf8",
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    console.error(`Please ensure the directory ${dataDir} exists and is writable`);
    process.exit(1);
  }
};
