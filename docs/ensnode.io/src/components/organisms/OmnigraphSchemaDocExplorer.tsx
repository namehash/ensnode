import "@graphiql/react/style.css";
import "@graphiql/plugin-doc-explorer/style.css";

import { DocExplorer, DocExplorerStore } from "@graphiql/plugin-doc-explorer";
import { GraphiQLProvider } from "@graphiql/react";
import { buildSchema } from "graphql";
import { ACTIVE_OMNIGRAPH_VERSION } from "@data/omnigraph-examples/active";

// Render the schema for the production-locked Omnigraph version (the same version the examples and
// walkthroughs target), NOT the live `main` SDL — `main` runs ahead of production. Schemas are frozen
// per-version under `src/data/omnigraph-examples/versions/<version>/schema.graphql`; glob all (Vite
// can't import a runtime-variable path) and select the active one.
const schemasByVersion = import.meta.glob<string>(
  "../../data/omnigraph-examples/versions/*/schema.graphql",
  { query: "?raw", import: "default", eager: true },
);
const omnigraphSchemaSdl =
  schemasByVersion[
    `../../data/omnigraph-examples/versions/${ACTIVE_OMNIGRAPH_VERSION}/schema.graphql`
  ];
if (!omnigraphSchemaSdl) {
  throw new Error(`No Omnigraph schema snapshot for version "${ACTIVE_OMNIGRAPH_VERSION}".`);
}

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
