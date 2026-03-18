import { createOpenApiApp } from "@/lib/hono-factory";

import nameTokensApi from "./explore/name-tokens-api";
import registrarActionsApi from "./explore/registrar-actions-api";
import ensnodeGraphQLApi from "./graphql/ensnode-graphql-api";
import metaApi from "./meta/ensnode-api";
import realtimeApi from "./meta/realtime-api";
import resolutionApi from "./resolution/resolution-api";

const app = createOpenApiApp();

app.route("/", metaApi);
app.route("/realtime", realtimeApi);
app.route("/resolve", resolutionApi);
app.route("/name-tokens", nameTokensApi);
app.route("/registrar-actions", registrarActionsApi);
app.route("/graphql", ensnodeGraphQLApi);

export default app;
