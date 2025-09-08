import { getTabId } from "@/lib/tab-utils";
import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

/**
 * Create a query client to be used on the server and browser.
 *
 * @returns A query client.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000, // 5 seconds
        refetchInterval: 10 * 1000, // 10 seconds
        queryKeyHashFn: (queryKey) => {
          const tabId = getTabId();
          return JSON.stringify([tabId, ...queryKey]);
        },
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

const browserQueryClients = new Map<string, QueryClient>();

/**
 * Get a query client.
 *
 * On the server, we create a new query client for each request.
 * On the browser, we create a unique query client per tab to isolate state.
 *
 * Note: Next.js uses implicit suspense boundaries so we need to be careful to
 * avoid creating too many query clients and loose the benefits of query persistence.
 *
 * @returns A query client.
 */
export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    const tabId = getTabId();

    if (!browserQueryClients.has(tabId)) {
      browserQueryClients.set(tabId, makeQueryClient());
    }

    return browserQueryClients.get(tabId)!;
  }
}
