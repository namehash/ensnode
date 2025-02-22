import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { graphql as subgraphGraphQL } from "@ensnode/ponder-subgraph/middleware";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { cors } from "hono/cors";
import { client, graphql as ponderGraphQL } from "ponder";
import { z } from "zod";
import { ensNodeMetadata } from "../lib/middleware";
// For extending the Zod schema with OpenAPI properties
import "zod-openapi/extend";

const app = new Hono();

// use CORS middleware
app.use(
  cors({
    origin: "*",
  }),
);

const packageJson = await import("../../package.json").then((m) => m.default);
const OPEN_API_MANIFEST_PATH = "/api/openapi.json";
app.get(
  OPEN_API_MANIFEST_PATH,
  openAPISpecs(app, {
    documentation: {
      info: {
        title: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
      },
      servers: [
        {
          url: process.env.PUBLIC_SERVICE_URL,
        },
      ],
    },
  }),
);

// Use the middleware to serve Swagger UI at /ui
app.get("/swagger", swaggerUI({ url: OPEN_API_MANIFEST_PATH }));

// use ENSNode middleware at /metadata
app.get(
  "/metadata",
  describeRoute({
    description: "Metadata describing the ENSNode service instance",
    responses: {
      200: {
        description: "Metadata object",
        content: {
          "text/json": {
            schema: resolver(
              z.any().openapi({
                type: "object",
              }),
            ),
          },
        },
      },
    },
  }),
  ensNodeMetadata({
    db,
    publicClients,
  }),
);

// use ponder client support
app.use("/sql/*", client({ db, schema }));

// use ponder middleware at root
app.get(
  "/ponder",
  describeRoute({
    description: "GraphiQL UI for the ENSNode service instance",
  }),
  ponderGraphQL({ db, schema }),
);
app.post(
  "/ponder",
  describeRoute({
    description: "GraphQL API for the ENSNode service instance",
  }),
  ponderGraphQL({ db, schema }),
  zValidator(
    "json",
    z.object({
      query: z.string().default(`query GetLatestDomains {
  domains(orderBy: "createdAt", orderDirection: "desc") {
    items {
      name
      labelName
      createdAt
      expiryDate
    }
  }
}`),
      variables: z.object({}).optional(),
    }),
  ),
);

// use root to redirect to the ENSAdmin website with the current server URL as ensnode parameter
app.use("/", async (ctx) =>
  ctx.redirect(`https://admin.ensnode.io/about?ensnode=${process.env.PUBLIC_SERVICE_URL}`),
);

// use our custom graphql middleware at /subgraph
app.use(
  "/subgraph",
  subgraphGraphQL({
    db,
    schema,

    // describes the polymorphic (interface) relationships in the schema
    polymorphicConfig: {
      types: {
        DomainEvent: [
          schema.transfer,
          schema.newOwner,
          schema.newResolver,
          schema.newTTL,
          schema.wrappedTransfer,
          schema.nameWrapped,
          schema.nameUnwrapped,
          schema.fusesSet,
          schema.expiryExtended,
        ],
        RegistrationEvent: [schema.nameRegistered, schema.nameRenewed, schema.nameTransferred],
        ResolverEvent: [
          schema.addrChanged,
          schema.multicoinAddrChanged,
          schema.nameChanged,
          schema.abiChanged,
          schema.pubkeyChanged,
          schema.textChanged,
          schema.contenthashChanged,
          schema.interfaceChanged,
          schema.authorisationChanged,
          schema.versionChanged,
        ],
      },
      fields: {
        "Domain.events": "DomainEvent",
        "Registration.events": "RegistrationEvent",
        "Resolver.events": "ResolverEvent",
      },
    },
  }),
);

export default app;
