---
name: fix-audit
description: >
  Fix security vulnerabilities found by pnpm audit using a git worktree off of `main`.
  Also use to maintain `pnpm.overrides` hygiene: prune overrides that are no longer
  necessary and scope overrides so they don't rewrite peerDependency ranges.
---

# Fix Audit

Fix security vulnerabilities reported by `pnpm audit` / `pnpm audit:osv`, keeping
`pnpm.overrides` minimal and scoped.

## Steps

1. Create a git worktree off of `main` (branch `fix/deps`).
2. Run `pnpm audit` and `pnpm audit:osv` to identify vulnerabilities.
3. For each vulnerability, trace who pulls it in: `pnpm why -r <pkg>`.
   - If a direct dependency: bump to the fixed version using a caret range (e.g. `^1.2.3`).
   - If transitive: try bumping the parent direct dependency first.
   - If the parent can't be bumped: add a `pnpm.overrides` entry (see format below).
4. Run `pnpm install` and read the output — new "unmet peer" or "deprecated" warnings
   mean an override is too broad (see Peer-range rewriting below).
5. Re-run the audits to verify; repeat until clean.
6. Prune obsolete overrides (see below) while you're here.
7. Validate from the repo root: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
8. Propose a PR using lite /pr-notes.

## Override format

Use a ranged selector key that names the vulnerable range, and a caret target. This
self-documents what the override guards and makes obsolescence checkable later:

```json
{
  "pnpm": {
    "overrides": {
      "vulnerable-package@<1.2.3": "^1.2.3"
    }
  }
}
```

## Peer-range rewriting: prefer scoped overrides

pnpm applies range-selector overrides to **peerDependency ranges too**. A global
override like `"vite@>=5.0.0 <=6.4.1": "^6.4.2"` rewrites every package's
`vite` peer range that intersects the selector (e.g. `^6 || ^7 || ^8` becomes
`^6.4.2`), producing false "unmet peer" warnings and duplicate installs across
the workspace.

If only one dependency subtree pulls the vulnerable version, scope the override
to that parent instead:

```json
{
  "pnpm": {
    "overrides": {
      "ponder>vite": "^6.4.2",
      "vite-node>vite": "^6.4.2"
    }
  }
}
```

Find the subtree(s) with `pnpm why -r <pkg>` before choosing global vs scoped.

## Pruning obsolete overrides

An override is obsolete when natural resolution no longer lands in the vulnerable
range (dependents widened their ranges, or a fixed version is now latest-in-range).
To check all overrides in one pass:

1. Back up `package.json` and `pnpm-lock.yaml`.
2. Set `pnpm.overrides` to `{}` and run `pnpm install --lockfile-only`.
3. For each override selector `pkg@<range>`, check whether any resolved version of
   `pkg` in the regenerated lockfile satisfies the vulnerable range
   (`semver.satisfies` against versions grepped from the lockfile's `packages:` section).
   - No match → override is unnecessary; remove it.
   - Match → still load-bearing; keep it.
4. Restore the backups, apply the pruning, and run `pnpm install`.

Expect the final lockfile diff to contain **no resolved-version changes** for pruned
overrides — pruning only removes override metadata. If versions change, the override
was still doing work; re-check.

## Unfixable warnings

- Deprecated transitive deps with no fixed upstream release (check
  `npm view <pkg>@<version> deprecated` and whether the parent has a newer version):
  acknowledge them in `pnpm.allowedDeprecatedVersions`, pinned to the exact current
  version so a future, different deprecated version still warns.
- Genuinely unmet peers that work in practice (e.g. an unmaintained package peering
  on an old major): acknowledge in `pnpm.peerDependencyRules.allowedVersions`, scoped
  as `"parent>peer": "^N"`.
- Verify suppressions under a _fresh_ resolution (warnings only print when resolution
  runs): back up the lockfile, delete it, `pnpm install --lockfile-only`, read the
  output, restore the lockfile.

## Rules

- ALWAYS use caret ranges (`^x.y.z`) for override targets, never bare `>=`, to prevent
  accidental major version bumps.
- Prefer bumping direct dependencies over adding overrides; prefer scoped overrides
  over global ones.
- Group related changes logically.
- If a fix requires a major version bump, warn me before proceeding.
- If a vulnerability cannot be fixed (no patched version available), report it at the end.
