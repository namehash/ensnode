import { defaultEnsNodeUrl } from "@/lib/env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Helper to load connections from localStorage
function loadConnections(): Array<Connection> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const urls = saved ? (JSON.parse(saved) as Array<string>) : [defaultEnsNodeUrl()];

    if (!urls.includes(defaultEnsNodeUrl())) {
      urls.unshift(defaultEnsNodeUrl());
    }

    return urls.map((url) => ({
      url,
      isDefault: url === defaultEnsNodeUrl(),
    }));
  } catch {
    return [{ url: defaultEnsNodeUrl(), isDefault: true }];
  }
}

// Helper to save connections to localStorage
function saveConnections(connections: Connection[]) {
  const urls = connections.map((c) => c.url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export function useConnections() {
  const queryClient = useQueryClient();
  // TODO: replace with a more advanced validator in the future
  // For now, we only check if the URL is valid
  // In the future, we may want to check if the URL points to
  // a compatible ENSNode service
  const validator = new BasicEnsNodeValidator();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: loadConnections,
    // Enable this query only in the browser
    enabled: typeof window !== "undefined",
  });

  const addConnection = useMutation({
    mutationFn: async ({ url }: AddConnectionVariables) => {
      // Validate the URL
      const validationResult = await validator.validate(url);
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

  return {
    connections,
    isLoading,
    addConnection,
    removeConnection,
  };
}
