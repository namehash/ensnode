import config from "@/config";
import { prettyPrintRedactedConfig } from "@/config/debug";
import ponderConfig from "@/ponder/config";

////////
// Log redacted ENSIndexerConfig for debugging.
////////

prettyPrintRedactedConfig(config);

////////
// Export the ponderConfig for Ponder to use for type inference and runtime behavior.
////////
export default ponderConfig;
