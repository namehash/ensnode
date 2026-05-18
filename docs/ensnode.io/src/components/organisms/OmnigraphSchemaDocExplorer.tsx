import "@graphiql/react/style.css";
import "@graphiql/plugin-doc-explorer/style.css";

import { DocExplorer, DocExplorerStore } from "@graphiql/plugin-doc-explorer";
import { GraphiQLProvider } from "@graphiql/react";
import omnigraphSchemaSdl from "enssdk/omnigraph/schema.graphql?raw";
import { buildSchema } from "graphql";

const omnigraphSchema = buildSchema(omnigraphSchemaSdl);

export default function OmnigraphSchemaDocExplorer() {
  return (
    <div
      style={{
        border: "1px solid var(--sl-color-gray-5)",
        borderRadius: "1rem",
        paddingLeft: "1rem",
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
    >
      <div
        className="graphiql-container"
        style={{
          maxHeight: "650px",
          overflow: "auto",
        }}
        data-theme="light"
      >
        <GraphiQLProvider
          defaultTheme="light"
          schema={omnigraphSchema}
          dangerouslyAssumeSchemaIsValid
          fetcher={() => Promise.resolve({})}
        >
          <DocExplorer />
        </GraphiQLProvider>
      </div>
    </div>
  );
}
