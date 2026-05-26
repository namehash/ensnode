import { buildSchema } from "graphql";
import { ACTIVE_OMNIGRAPH_VERSION } from "@data/omnigraph-examples/active";
import GraphQLSchemaDocExplorer from "./GraphQLSchemaDocExplorer.tsx";

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
  return <GraphQLSchemaDocExplorer schema={omnigraphSchema} />;
}
