export interface EnsNodeClientConfig {
  /**
   * ENSNode instance URL (e.g. "https://api.alpha.ensnode.io")
   */
  url: string;

  /**
   * Optional fetch implementation (for Node/edge runtimes)
   */
  fetch?: typeof globalThis.fetch;
}

export type EnsNodeClient<TExtended extends object = {}> = TExtended & {
  readonly config: Readonly<EnsNodeClientConfig>;
  extend<const T extends object & { config?: never; extend?: never }>(
    fn: (client: EnsNodeClient<TExtended>) => T,
  ): EnsNodeClient<TExtended & T>;
};

export function createEnsNodeClient(config: EnsNodeClientConfig): EnsNodeClient {
  const frozenConfig = Object.freeze({ ...config });

  function makeClient(base: Record<string, unknown>): EnsNodeClient<Record<string, unknown>> {
    const client = {
      ...base,
      config: frozenConfig,
      extend(fn: (client: any) => object) {
        const extension = fn(client);
        return makeClient({
          ...base,
          ...(extension as Record<string, unknown>),
        });
      },
    };
    return client as EnsNodeClient<Record<string, unknown>>;
  }

  return makeClient({}) as EnsNodeClient;
}
