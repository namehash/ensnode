import config from "@/config";
import { Hono } from "hono";

import resolutionApi from "../lib/resolution-api";

const app = new Hono();

// conditionally include experimental resolution api
if (config.experimental_resolution) {
  app.route("/resolve", resolutionApi);
}

export default app;
