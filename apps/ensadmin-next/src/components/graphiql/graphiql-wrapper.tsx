'use client';

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import 'graphiql/graphiql.css';

interface GraphiQLWrapperProps {
  endpointUrl: string
}

export function GraphiQLWrapper({ endpointUrl }: GraphiQLWrapperProps) {
  const fetcher = createGraphiQLFetcher({
    url: endpointUrl,
    // Disable subscriptions for now since we don't have a WebSocket server
    // legacyWsClient: false,
  });

  // Create a unique storage namespace for each endpoint
  const storageNamespace = `ensnode:graphiql:${endpointUrl}`;

  // Custom storage implementation with namespaced keys
  const storage = {
    getItem: (key: string) => {
      return localStorage.getItem(`${storageNamespace}:${key}`);
    },
    setItem: (key: string, value: string) => {
      localStorage.setItem(`${storageNamespace}:${key}`, value);
    },
    removeItem: (key: string) => {
      localStorage.removeItem(`${storageNamespace}:${key}`);
    },
    clear: () => {
      localStorage.clear();
    },
    length: localStorage.length,
  };

  return (
    <>
      {/* Endpoint URL */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600">
            Endpoint:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">{endpointUrl}</code>
          </p>
        </div>
      </div>

      {/* GraphiQL Interface */}
      <div className="flex-1 graphiql-container">
        <GraphiQL
          fetcher={fetcher}
          defaultEditorToolsVisibility={true}
          shouldPersistHeaders={true}
          storage={storage}
        />
      </div>
    </>
  );
}
