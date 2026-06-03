# `ensskills` Example

A minimal Node project for dogfooding the [`ensskills`](../../packages/ensskills) package — the
versioned agent skills that teach AI coding agents the ENS Omnigraph.

Unlike the published quickstart (which pins `ensskills` to an exact version), this example installs
it from the workspace (`ensskills: workspace:*`) so you exercise whatever is on your current branch.

Refer to the [ensskills integration guide](https://ensnode.io/docs/integrate/integration-options/ensskills) to use `ensskills` in your own project.

## How it works

[`skills-npm`](https://github.com/antfu/skills-npm) discovers the `skills/` bundles shipped by
`ensskills` and symlinks them into your agent directory. The `prepare` script runs it on install.

`skills-npm.config.ts` scopes the install to this example:

- `--cwd .` (in `package.json`) keeps skills-npm from walking up to the monorepo root — without it,
  skills-npm detects `pnpm-workspace.yaml` and would symlink into the repo root's agent dirs.
- `agents: ["claude-code"]` targets Claude Code. Drop it to auto-detect every agent you have installed.
- `include: ["ensskills"]` pulls skills only from the workspace package.

## Usage

```sh
# from the ENSNode monorepo root
pnpm install

# trigger the prepare script to symlink the skills
pnpm -F ensskills-example prepare
```

After install, the skills are symlinked under `examples/ensskills-example/.claude/skills/`. Open this
directory with Claude Code and the `omnigraph`, `enscli`, `ens-protocol`, … skills are available.

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
