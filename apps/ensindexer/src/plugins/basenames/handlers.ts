/**
 * Indexing handlers for the `basenames` plugin that will be executed
 * only if the plugin set as active in the ENSIndexerConfig
 */

import resolverHandlers from "@/plugins/shared/Resolver";
import registrarHandlers from "./handlers/Registrar";
import registryHandlers from "./handlers/Registry";

export default [resolverHandlers, registrarHandlers, registryHandlers];
