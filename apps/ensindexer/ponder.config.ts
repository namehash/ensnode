import config from "@/config";
import { prettyPrintConfig } from "@/lib/lib-config";
import ponderConfig from "@/ponder/config";

////////
// Log ENSIndexerConfig for debugging.
////////

console.log(`ENSIndexer running with config:\n${prettyPrintConfig(config)}`);

////////
// Export the ponderConfig for Ponder to use for type inference and runtime behavior.
////////
export default ponderConfig;
