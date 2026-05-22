import "@graphiql/react/style.css";
import "@graphiql/plugin-doc-explorer/style.css";

import { DocExplorer } from "@graphiql/plugin-doc-explorer";
import { GraphiQLProvider } from "@graphiql/react";
import { buildSchema } from "graphql";
import { ACTIVE_OMNIGRAPH_VERSION } from "@data/omnigraph-examples/active";

// select the active omnigraph schema for rendering
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
