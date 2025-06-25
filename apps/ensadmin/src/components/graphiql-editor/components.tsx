"use client";

import "graphiql/graphiql.css";
import "@graphiql/plugin-explorer/style.css";

import { AiQueryGeneratorForm } from "@/components/ai-query-generator";
import { explorerPlugin } from "@graphiql/plugin-explorer";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL, type GraphiQLProps } from "graphiql";
import { useSearchParams } from "next/navigation";
import { useGraphiQLEditor } from "./hooks";

const defaultQuery = `#
# Welcome to this interactive playground for
# ENSNode's GraphQL API!
#
# You can get started by typing using
# the Explorer on the left to select the data
# you want to query.
#
# When you are ready to execute the query,
# press the pink Play icon -->
#
`;

/**
 * A GraphiQL editor for Ponder API page.
 */
export function PonderGraphiQLEditor(props: GraphiQLPropsWithUrl) {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") || defaultQuery;
  const initialVariables = searchParams.get("variables") || "";

  const graphiqlEditor = useGraphiQLEditor({
    query: initialQuery,
    variables: initialVariables,
  });

  return (
    <section className="flex flex-col flex-1">
      <GraphiQLEditor
        {...props}
        query={graphiqlEditor.state.query || initialQuery}
        variables={graphiqlEditor.state.variables || initialVariables}
      />
    </section>
  );
}

/**
 * A GraphiQL editor for Subgraph API page.
 */
export function SubgraphGraphiQLEditor(props: GraphiQLPropsWithUrl) {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") || defaultQuery;
  const initialVariables = searchParams.get("variables") || "";

  const graphiqlEditor = useGraphiQLEditor({
    query: initialQuery,
    variables: initialVariables,
  });

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
        query={graphiqlEditor.state.query || initialQuery}
        variables={graphiqlEditor.state.variables || initialVariables}
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
