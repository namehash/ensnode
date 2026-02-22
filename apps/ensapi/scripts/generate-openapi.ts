import packageJson from "../package.json" with { type: "json" };

import { openapiDocumentation } from "../src/openapi-documentation";
import { createRoutesForSpec } from "../src/openapi-routes";

const version = process.env.ENSAPI_VERSION ?? packageJson.version ?? "0.0.0";

const app = createRoutesForSpec();

const spec = app.getOpenAPI31Document({
  ...openapiDocumentation,
  info: {
    ...openapiDocumentation.info,
    version,
  },
});

console.log(JSON.stringify(spec, null, 2));
