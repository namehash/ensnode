import { createApp } from "@/lib/hono-factory";
import { assertApiReadinessMiddleware } from "@/middleware/assert-api-readiness.middleware";

import nameTokensApi from "./explore/name-tokens-api";
import registrarActionsApi from "./explore/registrar-actions-api";
import realtimeApi from "./meta/realtime-api";
import statusApi from "./meta/status-api";
import omnigraphApi from "./omnigraph/omnigraph-api";
import resolutionApi from "./resolution/resolution-api";

const app = createApp({ middlewares: [assertApiReadinessMiddleware] });

app.route("/", statusApi);
app.route("/realtime", realtimeApi);
app.route("/resolve", resolutionApi);
app.route("/name-tokens", nameTokensApi);
app.route("/registrar-actions", registrarActionsApi);
app.route("/omnigraph", omnigraphApi);

export default app;
