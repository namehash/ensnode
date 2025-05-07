"use client";

import "graphiql/graphiql.css";
import "@graphiql/plugin-explorer/style.css";

import { AiQueryGeneratorForm } from "@/components/ai-query-generator";
import { explorerPlugin } from "@graphiql/plugin-explorer";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL, type GraphiQLProps } from "graphiql";
import { useMemo } from "react";
import { useGraphiQLEditor } from "./hooks";
import { type SavedQuery, savedQueriesPlugin } from "./plugins/saved-queries";

export type { SavedQuery };

interface GraphiQLEditorProps
  extends Omit<GraphiQLPropsWithUrl, "plugins" | "query" | "variables"> {
  savedQueries?: Array<SavedQuery>;
}

/**
 * A GraphiQL editor for Ponder API page.
 */
export function PonderGraphiQLEditor(props: GraphiQLEditorProps) {
  const graphiqlEditor = useGraphiQLEditor();

  const plugins = useMemo(
    () => [
      savedQueriesPlugin({
        queries: props.savedQueries ?? [],
        onQuerySelect: ({ query, variables }) => {
          if (variables) {
            graphiqlEditor.actions.setQueryAndVariables(query, variables);
          } else {
            graphiqlEditor.actions.setQuery(query);
          }
        },
      }),
    ],
    [props.savedQueries, graphiqlEditor.actions],
  );

  return (
    <section className="flex flex-col flex-1">
      <GraphiQLEditor
        {...props}
        query={graphiqlEditor.state.query}
        variables={graphiqlEditor.state.variables}
        plugins={plugins}
      />
    </section>
  );
}

/**
 * A GraphiQL editor for Subgraph API page.
 */
export function SubgraphGraphiQLEditor(props: GraphiQLEditorProps) {
  const graphiqlEditor = useGraphiQLEditor();

  const plugins = useMemo(
    () => [
      savedQueriesPlugin({
        queries: props.savedQueries ?? [],
        onQuerySelect: ({ query, variables }) => {
          if (variables) {
            graphiqlEditor.actions.setQueryAndVariables(query, variables);
          } else {
            graphiqlEditor.actions.setQuery(query);
          }
        },
      }),
    ],
    [props.savedQueries, graphiqlEditor.actions],
  );

  return (
    <section className="flex flex-col flex-1">
      <AiQueryGeneratorForm
        onResult={({ query, variables }) => {
          graphiqlEditor.actions.setQueryAndVariables(query, JSON.stringify(variables));
        }}
        url={props.url}
      />

      <GraphiQLEditor
        {...props}
        query={graphiqlEditor.state.query}
        variables={graphiqlEditor.state.variables}
        plugins={plugins}
      />
    </section>
  );
}

interface GraphiQLPropsWithUrl extends Omit<GraphiQLProps, "fetcher"> {
  /** The URL of the GraphQL endpoint */
  url: string;
}

/**
 * The GraphiQL editor component used to render the generic GraphiQL editor UI.
 * We use this component to render the Ponder and Subgraph GraphiQL editors
 * that are exported from this file.
 */
function GraphiQLEditor({ url, plugins = [], ...props }: GraphiQLPropsWithUrl) {
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

  const explorer = explorerPlugin();

  return (
    <div className="flex-1 graphiql-container">
      <GraphiQL
        defaultEditorToolsVisibility={true}
        shouldPersistHeaders={true}
        storage={storage}
        forcedTheme="light"
        fetcher={fetcher}
        plugins={[explorer, ...plugins]}
        {...props}
      />
    </div>
  );
}
