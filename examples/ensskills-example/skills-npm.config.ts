import { defineConfig } from "skills-npm";

// Dogfood the workspace `ensskills` package: symlink its skill bundles into
// this example's agent directory so you can exercise them with a coding agent.
//
// `cwd` is pinned to this directory via the `--cwd .` flag in package.json so
// skills-npm scopes its symlinks (and .gitignore edits) to the example, rather
// than walking up to the monorepo root.
export default defineConfig({
  // Install for Claude Code. Drop this to auto-detect every agent you have.
  agents: ["claude-code"],
  // Only pull skills from the workspace ensskills package.
  include: ["ensskills"],
  yes: true,
});
