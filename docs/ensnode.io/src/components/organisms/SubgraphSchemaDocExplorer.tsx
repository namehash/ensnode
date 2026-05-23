import subgraphSchemaSdl from "@data/subgraph-schema.graphql?raw";
import { buildSchema } from "graphql";
import GraphQLSchemaDocExplorer from "./GraphQLSchemaDocExplorer.tsx";

const subgraphSchema = buildSchema(subgraphSchemaSdl);

export default function SubgraphSchemaDocExplorer() {
  return <GraphQLSchemaDocExplorer schema={subgraphSchema} />;
}
