"use client";

import "graphiql/graphiql.css";

import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL, type GraphiQLProps } from "graphiql";

// TODO: Remove this import
import { savedQueries } from "@/app/gql/ponder/plugins/saved-queries";

export type GraphiQLPropsWithUrl = Omit<GraphiQLProps, "fetcher"> & {
  url?: string;
};

export function GraphiQLEditor({ url, ...props }: GraphiQLPropsWithUrl) {
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
        defaultEditorToolsVisibility={true}
        shouldPersistHeaders={true}
        storage={storage}
        forcedTheme="light"
        fetcher={fetcher}
        // TODO: Don't pass plugins here, instead let props do it
        // See app/gql/ponder/page.tsx
        plugins={[savedQueries]}
        {...props}
      />
    </div>
  );
}
