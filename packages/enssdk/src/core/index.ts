export interface ENSSDKClientConfig {
  /**
   * ENSNode instance URL (e.g. "https://api.alpha.ensnode.io")
   */
  url: string;

  /**
   * Optional fetch implementation (for Node/edge runtimes)
   */
  fetch?: typeof globalThis.fetch;
}

export type ENSSDKClient<TExtended extends object = {}> = TExtended & {
  readonly config: Readonly<ENSSDKClientConfig>;
  extend<const T extends object & { config?: never; extend?: never }>(
    fn: (client: ENSSDKClient<TExtended>) => T,
  ): ENSSDKClient<TExtended & T>;
};

export function createENSSDKClient(config: ENSSDKClientConfig): ENSSDKClient {
  const frozenConfig = Object.freeze({ ...config });

  function makeClient(base: Record<string, unknown>): ENSSDKClient<Record<string, unknown>> {
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
    return client as ENSSDKClient<Record<string, unknown>>;
  }

  return makeClient({}) as ENSSDKClient;
}
