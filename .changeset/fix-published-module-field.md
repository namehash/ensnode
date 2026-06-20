---
"@ensnode/datasources": patch
"@ensnode/ensrainbow-sdk": patch
"@namehash/namehash-ui": patch
"@ensnode/ponder-subgraph": patch
---

Point `publishConfig.module` at the emitted `./dist/index.js` instead of `./dist/index.mjs`. These packages are `"type": "module"` and tsup emits ESM as `index.js`, so the published `module` field referenced a file that was never present in the tarball.
