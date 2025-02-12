import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import { useOutletContext } from "react-router-dom";
import "graphiql/graphiql.css";

interface AppContext {
  ensnodeUrl: string;
}

interface GraphiQLWrapperProps {
  endpoint: "ponder" | "subgraph";
}

export function GraphiQLWrapper({ endpoint }: GraphiQLWrapperProps) {
  const { ensnodeUrl } = useOutletContext<AppContext>();
  const url =
    endpoint === "subgraph"
      ? `${ensnodeUrl}/subgraph`
      : // TODO: update to `/ponder` when available
        `${ensnodeUrl}/`;

  const fetcher = createGraphiQLFetcher({ url });

  // Create a unique storage namespace for each endpoint
  const storageNamespace = `graphiql:${endpoint}`;

  // Custom storage implementation with namespaced keys
  const storage = {
    getItem(key: string) {
      return localStorage.getItem(`${storageNamespace}:${key}`);
    },
    setItem(key: string, value: string) {
      localStorage.setItem(`${storageNamespace}:${key}`, value);
    },
    removeItem(key: string) {
      localStorage.removeItem(`${storageNamespace}:${key}`);
    },
    clear() {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(`${storageNamespace}:`))
        .forEach((key) => localStorage.removeItem(key));
    },
    length: Object.keys(localStorage).filter((key) => key.startsWith(`${storageNamespace}:`))
      .length,
  };

  return (
    <>
      {/* Endpoint URL */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600">
            Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{url}</code>
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
