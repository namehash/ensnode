import { defaultEnsNodeUrls } from "@/lib/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BasicEnsNodeValidator } from "./ensnode-url-validator";

interface Connection {
  url: string;
  isDefault: boolean;
}

interface AddConnectionVariables {
  url: string;
}

interface RemoveConnectionVariables {
  url: string;
}

const STORAGE_KEY = "ensadmin:connections:urls";

// TODO: replace with a more advanced validator in the future
// For now, we only check if the URL is valid
// In the future, we may want to check if the URL points to
// a compatible ENSNode service
const ensNodeValidator = new BasicEnsNodeValidator();

const defaultConnections: Array<Connection> = defaultEnsNodeUrls().map((defaultEnsNodeUrl) => ({
  url: defaultEnsNodeUrl.toString(),
  isDefault: true,
}));

/**
 * Load connections list.
 * Uses application configuration (default connections) and localStorage (saved connections).
 **/
function loadConnections(): Array<Connection> {
  let connections: Array<Connection>;

  try {
    const savedUrlsRaw = localStorage.getItem(STORAGE_KEY);
    const savedUrls = savedUrlsRaw ? JSON.parse(savedUrlsRaw) : [];
    const savedConnections: Array<Connection> = savedUrls
      .filter(
        // filter out those savedConnectionUrl strings that are not on defaultEnsNodeUrls list
        (savedConnectionUrl: string) =>
          defaultEnsNodeUrls().every((url) => url.toString() !== savedConnectionUrl),
      )
      .map((url: string) => ({
        url,
        isDefault: false,
      }));

    connections = [...defaultConnections, ...savedConnections];
  } catch {
    connections = defaultConnections;
  }

  return connections;
}

/**
 * Stores saved connections.
 *
 * @param connections
 */
function saveConnections(connections: Connection[]) {
  const urls = connections.map((c) => c.url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

interface UseConnectionsProps {
  selectedEnsNodeUrl: URL;
}

export function useConnections({ selectedEnsNodeUrl }: UseConnectionsProps) {
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: loadConnections,
    // Enable this query only in the browser
    enabled: typeof window !== "undefined",
  });

  const addConnection = useMutation({
    mutationFn: async ({ url }: AddConnectionVariables) => {
      // Validate the URL
      const validationResult = await ensNodeValidator.validate(url);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || "Invalid URL");
      }

      // Check if URL already exists
      if (connections.some((c) => c.url === url)) {
        throw new Error("Connection already exists");
      }

      // Add new connection
      const newConnections = [...connections, { url, isDefault: false }];
      saveConnections(newConnections);

      return { url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  const removeConnection = useMutation({
    mutationFn: async ({ url }: RemoveConnectionVariables) => {
      // Check if trying to remove preferred connection
      const connection = connections.find((c) => c.url === url);
      if (!connection) {
        throw new Error("Connection not found");
      }
      if (connection.isDefault) {
        throw new Error("Cannot remove preferred connection");
      }

      // Remove connection
      const newConnections = connections.filter((c) => c.url !== url);
      saveConnections(newConnections);

      return { url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  // attempt adding `selectedEnsNodeUrl` to connections list
  useEffect(() => {
    if (connections.length === 0) {
      // only try adding selec
      return;
    }

    if (addConnection.isIdle) {
      const url = selectedEnsNodeUrl.toString();

      if (connections.some((c) => c.url.toString() === url)) {
        return;
      }

      addConnection.mutateAsync({ url });
    }
  }, [addConnection, connections, selectedEnsNodeUrl]);

  return {
    connections,
    isLoading,
    addConnection,
    removeConnection,
  };
}
