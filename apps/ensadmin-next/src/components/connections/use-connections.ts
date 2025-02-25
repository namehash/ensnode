import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BasicEnsNodeValidator } from './ensnode-url-validator';
import { preferredEnsNodeUrl } from '@/lib/env';

interface Connection {
  url: string;
  isPreferred: boolean;
}

interface AddConnectionVariables {
  url: string;
}

interface RemoveConnectionVariables {
  url: string;
}

const STORAGE_KEY = 'ensadmin:connections:urls';

// Helper to load connections from localStorage
function loadConnections(): Array<Connection> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const urls = saved ? JSON.parse(saved) as Array<string> : [preferredEnsNodeUrl()];
    
    if (!urls.includes(preferredEnsNodeUrl())) {
      urls.unshift(preferredEnsNodeUrl());
    }
    
    return urls.map(url => ({
      url,
      isPreferred: url === preferredEnsNodeUrl()
    }));
  } catch {
    return [{ url: preferredEnsNodeUrl(), isPreferred: true }];
  }
}

// Helper to save connections to localStorage
function saveConnections(connections: Connection[]) {
  const urls = connections.map(c => c.url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export function useConnections() {
  const queryClient = useQueryClient();
  const validator = new BasicEnsNodeValidator();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: () => loadConnections(),
    // Enable this query only in the browser
    enabled: typeof window !== 'undefined',
  });

  const addConnection = useMutation({
    mutationFn: async ({ url }: AddConnectionVariables) => {
      // Validate the URL
      const validationResult = await validator.validate(url);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'Invalid URL');
      }

      // Check if URL already exists
      if (connections.some(c => c.url === url)) {
        throw new Error('Connection already exists');
      }

      // Add new connection
      const newConnections = [...connections, { url, isPreferred: false }];
      saveConnections(newConnections);
      
      return { url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  const removeConnection = useMutation({
    mutationFn: async ({ url }: RemoveConnectionVariables) => {
      // Check if trying to remove preferred connection
      const connection = connections.find(c => c.url === url);
      if (!connection) {
        throw new Error('Connection not found');
      }
      if (connection.isPreferred) {
        throw new Error('Cannot remove preferred connection');
      }

      // Remove connection
      const newConnections = connections.filter(c => c.url !== url);
      saveConnections(newConnections);
      
      return { url };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  return {
    connections,
    isLoading,
    addConnection,
    removeConnection,
  };
}
