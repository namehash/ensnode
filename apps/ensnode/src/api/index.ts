import { ponder } from "ponder:registry";
import { default as schema } from "ponder:schema";
import { graphql as subgraphGraphQL } from "ensnode-subgraph-graphql/middleware";
import { graphql as ponderGraphQL } from "ponder";

// use ponder middleware at root
ponder.use("/", ponderGraphQL());

// use our custom graphql middleware at /subgraph
ponder.use("/subgraph", subgraphGraphQL({ schema }));
