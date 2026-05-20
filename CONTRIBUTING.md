# Contributing to ENSNode

Thank you for your interest in contributing to ENSNode! We welcome contributions from the community.

## Documentation

For detailed contribution guidelines and setup instructions:

- **ENSNode**: Visit [ENSNode Contributing Guide](https://ensnode.io/docs/contributing)
- **ENSRainbow**: Visit [ENSRainbow Contributing Guide](https://ensnode.io/ensrainbow/contributing)

## Using Biome and Prettier together

We use Biome as our primary code formatter, and our long-term goal is to rely on it exclusively.

However, support for Astro files is still experimental. Currently, Biome only formats the frontmatter section of .astro files, so we use Prettier to format the JSX portions.

### Applying both formatters

To ensure CI checks pass and the codebase is formatted correctly, run `pnpm lint` command from the repository root. This will run both Biome and Prettier formatting.

- Prettier formats `**/*.md` at the monorepo root.
- Each docs site (`docs/ensnode.io`, `docs/ensrainbow.io`) uses `prettier-plugin-astro` to format the template portion of its `.astro` files. The `astroSkipFrontmatter: true` option keeps Biome in charge of the frontmatter so the two formatters don't fight over the same code.

Run `pnpm lint` from the monorepo root to apply both. CI runs `pnpm lint:ci` (check-only).

> NOTE (Windows users): After running these steps, you may see many diffs with Contents have differences only in line separators comment.
>
> These files won't be included in your commit. For easier self-review either ignore them or (if valid in your case) run the git add --all command. This normalizes line endings and removes those entries from the diff.

## Getting Help

If you have questions or need help, please:

1. Check the documentation links above
2. Open a [GitHub Issue](https://github.com/namehash/ensnode/issues) for bugs/features
3. Join our community discussions on [GitHub](https://github.com/namehash/ensnode)
4. Join our community on [Telegram](http://t.me/ensnode)

We look forward to your contributions!
