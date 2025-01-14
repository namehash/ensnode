import { ponder } from "ponder:registry";

import { graphql } from "./middleware";

// use our custom graphql middleware
ponder.use("/", graphql());
