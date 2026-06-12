import { buildSchema } from "graphql";
import omnigraphSchemaSdl from "@data/omnigraph-examples/schema.graphql?raw";
import GraphQLSchemaDocExplorer from "./GraphQLSchemaDocExplorer.tsx";

const omnigraphSchema = buildSchema(omnigraphSchemaSdl);

export default function OmnigraphSchemaDocExplorer() {
  return <GraphQLSchemaDocExplorer schema={omnigraphSchema} />;
}
