import type { EnsApiConfig } from "@/config/config.schema";
import { buildConfigFromEnvironment } from "@/config/config.schema";

let _config: EnsApiConfig | null = null;

/**
 * Initializes the global config from environment variables.
 * Must be called before any config property is accessed (i.e. as the first
 * statement in index.ts, before the server starts).
 */
export async function initEnvConfig(env: NodeJS.ProcessEnv): Promise<void> {
  _config = await buildConfigFromEnvironment(env);
}

/**
 * Lazy config proxy — defers access to the underlying config object until it
 * has been initialized via initConfig().
 *
 * This allows app.ts (and all route/handler modules it imports) to be loaded
 * at module evaluation time without requiring env vars to be present. That
 * property is essential for the OpenAPI generation script, which imports app.ts
 * to introspect routes but never starts the server or calls initConfig().
 *
 * Any attempt to read a config property before initConfig() is called will
 * throw a descriptive error. Use @/lib/lazy to defer config-dependent
 * initialization in modules that are evaluated at import time.
 */
export default new Proxy({} as EnsApiConfig, {
  get(_, prop: string | symbol) {
    if (_config === null) {
      throw err(prop);
    }
    return _config[prop as keyof EnsApiConfig];
  },
  has(_, prop: string | symbol) {
    if (_config === null) {
      throw err(prop);
    }
    return prop in _config;
  },
});

const err = (prop: string | symbol) => {
  throw new Error(
    `Config not initialized — call initConfig() before accessing config.${String(prop)}
        Probably you access config in top level of the module. Use @/lib/lazy for lazy loading dependencies.`,
  );
};
