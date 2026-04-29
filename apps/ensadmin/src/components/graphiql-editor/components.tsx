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
const EXPLORER_PLUGIN = explorerPlugin();

/**
 * The GraphiQL editor component used to render the generic GraphiQL editor UI.
 * We use this component to render GraphiQL editors.
 */
export function GraphiQLEditor({ url, plugins = EMPTY_PLUGINS, ...props }: GraphiQLPropsWithUrl) {
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

  // Guard against SSR: hooks run before the early-return below, and `localStorage`
  // is undefined on the server. Returning `undefined` is safe because the component
  // returns `null` after the hooks when there's no window.
  const storage = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const storageNamespace = `ensnode:graphiql:${url}`;
    const prefix = `${storageNamespace}:`;
    return {
      getItem: (key: string) => localStorage.getItem(`${prefix}${key}`),
      setItem: (key: string, value: string) => localStorage.setItem(`${prefix}${key}`, value),
      removeItem: (key: string) => localStorage.removeItem(`${prefix}${key}`),
      // Only clear keys in this namespace so unrelated ENSAdmin state survives.
      clear: () => {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) localStorage.removeItem(key);
        }
      },
      get length() {
        return localStorage.length;
      },
    };
  }, [url]);

  const mergedPlugins = useMemo(() => [HISTORY_PLUGIN, EXPLORER_PLUGIN, ...plugins], [plugins]);

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
