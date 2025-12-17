import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "esbuild";

const projectRoot = process.cwd();
const distDir = join(projectRoot, "dist");

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
});

// Write the metafile
writeFileSync(join(distDir, "meta.json"), JSON.stringify(result.metafile, null, 2));
