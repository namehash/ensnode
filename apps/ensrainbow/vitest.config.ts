import { defineConfig, ViteUserConfig } from "vitest/config";

export type Runtime = "node" | "deno" | "bun";

export function getRuntime(): Runtime {
  if ("bun" in process.versions) return "bun";
  if ("deno" in process.versions) return "deno";

  return "node";
}

export function getPoolOptions(runtime: Runtime): ViteUserConfig["test"] {
  if (runtime === "node") {
    return {
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: true,
          minThreads: 2,
          maxThreads: 10,
        },
      },
    };
  }

  return {
    pool: "vitest-in-process-pool",
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      enabled: false,
    },
  };
}


export default defineConfig({
  test: {
    ...getPoolOptions(getRuntime()),
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
