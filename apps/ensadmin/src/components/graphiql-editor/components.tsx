"use client";

import "graphiql/setup-workers/webpack";
import "graphiql/style.css";
import "@graphiql/plugin-explorer/style.css";

import { explorerPlugin } from "@graphiql/plugin-explorer";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL, type GraphiQLProps, HISTORY_PLUGIN } from "graphiql";
import { useMemo } from "react";

interface GraphiQLPropsWithUrl extends Omit<GraphiQLProps, "fetcher"> {
  /** The URL of the GraphQL endpoint */
  url: string;
}

const EMPTY_PLUGINS: NonNullable<GraphiQLProps["plugins"]> = [];

/**
 * The GraphiQL editor component used to render the generic GraphiQL editor UI.
 * We use this component to render GraphiQL editors.
 */
export function GraphiQLEditor({
  url,
  plugins = EMPTY_PLUGINS,
  ...props
}: GraphiQLPropsWithUrl) {
  // Memoize the fetcher so its reference is stable across re-renders. Otherwise
  // GraphiQL re-runs schema introspection on every parent re-render (e.g. when
  // a parent subscribes to a 1s-ticking hook), which resets the docs sidebar.
  const fetcher = useMemo(
    () =>
      createGraphiQLFetcher({
        url,
        // Disable subscriptions for now since we don't have a WebSocket server
        // legacyWsClient: false,
        subscriptionUrl: undefined,
        wsConnectionParams: undefined,
      }),
    [url],
  );

  const storage = useMemo(() => {
    const storageNamespace = `ensnode:graphiql:${url}`;
    return {
      getItem: (key: string) => localStorage.getItem(`${storageNamespace}:${key}`),
      setItem: (key: string, value: string) =>
        localStorage.setItem(`${storageNamespace}:${key}`, value),
      removeItem: (key: string) => localStorage.removeItem(`${storageNamespace}:${key}`),
      clear: () => {
        localStorage.clear();
      },
      length: localStorage.length,
    };
  }, [url]);

  const mergedPlugins = useMemo(
    () => [HISTORY_PLUGIN, explorerPlugin(), ...plugins],
    [plugins],
  );

  if (!url || typeof window === "undefined") {
    return null;
  }

  return (
    <div className="flex-1 graphiql-container">
      <GraphiQL
        defaultEditorToolsVisibility={true}
        shouldPersistHeaders={true}
        storage={storage}
        forcedTheme="light"
        fetcher={fetcher}
        plugins={mergedPlugins}
        {...props}
      />
    </div>
  );
}
