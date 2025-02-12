export interface PonderClient {
  query: <T = unknown>(query: unknown) => Promise<T>;
}

export interface PonderClientConfig {
  url: string;
  schema: unknown;
}

export function createClient(config: PonderClientConfig): PonderClient {
  const { url } = config;

  return {
    query: async (query: unknown) => {
      const response = await fetch(`${url}/sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  };
}
