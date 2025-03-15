"use client";

import "graphiql/graphiql.css";

import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";

export function GraphiQLEditor({ url }: { url?: string }) {
  if (!url || typeof window === "undefined") {
    return null;
  }

  const fetcher = createGraphiQLFetcher({
    url,
    // Disable subscriptions for now since we don't have a WebSocket server
    // legacyWsClient: false,
    subscriptionUrl: undefined,
    wsConnectionParams: undefined,
  });

  // Create a unique storage namespace for each endpoint
  const storageNamespace = `ensnode:graphiql:${url}`;

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
    <div className="flex-1 graphiql-container">
      <GraphiQL
        fetcher={fetcher}
        defaultEditorToolsVisibility={true}
        shouldPersistHeaders={true}
        storage={storage}
        forcedTheme="light"
      />
    </div>
  );
}
