import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import { useOutletContext } from "react-router-dom";

interface AppContext {
  ensnodeUrl: URL;
}

interface GraphiQLWrapperProps {
  endpoint: "ponder" | "subgraph";
}

export function GraphiQLWrapper({ endpoint }: GraphiQLWrapperProps) {
  const { ensnodeUrl } = useOutletContext<AppContext>();
  const url =
    endpoint === "subgraph"
      ? new URL("/subgraph", ensnodeUrl)
      : // TODO: update to `/ponder` when available
        new URL("/", ensnodeUrl);

  const fetcher = createGraphiQLFetcher({ url: url.toString() });

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
      <div className="bg-gray-50 px-6 py-2 border-b border-gray-200">
        <div className="mx-auto">
          <p className="text-sm text-gray-600">
            Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">{url.toString()}</code>
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
