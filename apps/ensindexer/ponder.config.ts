import config from "@/config";
import { redactENSIndexerConfig } from "@/config/redact";
import ponderConfig from "@/ponder/config";
import { prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

////////
// Log redacted ENSIndexerConfig for debugging.
////////

console.log("ENSIndexer running with config:");
console.log(prettyPrintJson(redactENSIndexerConfig(config)));

////////
// Export the ponderConfig for Ponder to use for type inference and runtime behavior.
////////
export default ponderConfig;
