import type { EnsApiConfig } from "@/config/config.schema";
import { buildConfigFromEnvironment } from "@/config/config.schema";

let _config: EnsApiConfig | null = null;

export async function initConfig(env: NodeJS.ProcessEnv): Promise<void> {
  _config = await buildConfigFromEnvironment(env);
}

export default new Proxy({} as EnsApiConfig, {
  get(_, prop: string | symbol) {
    if (_config === null) {
      throw new Error(
        `Config not initialized — call initConfig() before accessing config.${String(prop)}
        Probably you access config in top level of the module. Use @/lib/lazy for lazy loading dependencies.`,
      );
    }
    return _config[prop as keyof EnsApiConfig];
  },
});
