import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql as ponderGraphQL } from "ponder";

const app = new Hono();

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at `/ponder`
app.use("/ponder", ponderGraphQL({ db, schema }));

export default app;
