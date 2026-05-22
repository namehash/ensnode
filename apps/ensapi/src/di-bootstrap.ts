/**
 * Temporary bridge until cache factories inject dependencies at construction time.
 *
 * `buildEnsApiDiContext` warms module-level SWR caches via `read()` before `di.context`
 * exists. Cache loaders still need `ensDbClient` and `ensApiConfig` but cannot import
 * `@/di` statically (circular dependency: di → cache modules → di). During bootstrap,
 * `setBootstrapDeps` supplies those deps; after init, `resolveDiDeps` falls back to
 * `di.context` for background revalidation and any runtime `read()` outside bootstrap.
 *
 * Remove this module once caches are created with some factory function.
 */
import type { EnsDbReader } from "@ensnode/ensdb-sdk";

import type { EnsApiConfig } from "@/config/config.schema";

export type DiBootstrapDeps = {
  ensDbClient: EnsDbReader;
  ensApiConfig: EnsApiConfig;
};

let bootstrapDeps: DiBootstrapDeps | undefined;

export function setBootstrapDeps(deps: DiBootstrapDeps): void {
  bootstrapDeps = deps;
}

export function clearBootstrapDeps(): void {
  bootstrapDeps = undefined;
}

function getBootstrapDeps(): DiBootstrapDeps | undefined {
  return bootstrapDeps;
}

/**
 * Resolves ENSDb client and ENSApi config for cache loaders during DI bootstrap or at runtime.
 */
export async function resolveDiDeps(): Promise<DiBootstrapDeps> {
  const bootstrap = getBootstrapDeps();
  if (bootstrap) {
    return bootstrap;
  }

  const di = await import("@/di").then((mod) => mod.default);
  return {
    ensDbClient: di.context.ensDbClient,
    ensApiConfig: di.context.ensApiConfig,
  };
}
