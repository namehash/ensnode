import omnigraphSchemaSdl from "enssdk/omnigraph/schema.graphql?raw";
import { buildSchema } from "graphql";
import GraphQLSchemaDocExplorer from "./GraphQLSchemaDocExplorer.tsx";

const omnigraphSchema = buildSchema(omnigraphSchemaSdl);

export default function OmnigraphSchemaDocExplorer() {
  return <GraphQLSchemaDocExplorer schema={omnigraphSchema} />;
}
