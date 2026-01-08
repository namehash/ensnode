import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "esbuild";

const projectRoot = process.cwd();
const distDir = join(projectRoot, "dist");

// build dist/index.mjs
const result = await build({
  entryPoints: [join(projectRoot, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: join(distDir, "index.mjs"),
  mainFields: ["module", "main"],
  conditions: ["node", "import"],
  external: ["@aws-sdk/*", "aws-sdk"],
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },
  metafile: true,
  minify: true,
  sourcemap: false,
  treeShaking: true,
  logLevel: "info",
  define: {
    // define NODE_ENV as production when building to strip out @hono/node-server usage
    "process.env.NODE_ENV": '"production"',
  },
});

// write dist/meta.json, analyze with https://esbuild.github.io/analyze/
writeFileSync(join(distDir, "meta.json"), JSON.stringify(result.metafile, null, 2));
