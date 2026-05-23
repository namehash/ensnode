# Contributing to ENSNode

Thank you for your interest in contributing to ENSNode! We welcome contributions from the community.

## Documentation

For detailed setup instructions, visit the [ENSNode Contributing Guide](https://ensnode.io/docs/reference/contributing).

## Using Biome and Prettier together

Biome is our primary formatter; the long-term goal is to use it for everything. Two gaps remain today:

- Biome doesn't format Markdown, so Prettier handles `**/*.{md,mdx}` repo-wide.
- Biome's `.astro` support only covers the frontmatter (the `---` script block). Prettier with `prettier-plugin-astro` handles the template portion in `docs/ensnode.io` and `docs/ensrainbow.io`. The `astroSkipFrontmatter: true` option keeps Biome in charge of the frontmatter so the two formatters don't fight over the same code.

Run `pnpm lint` at the monorepo root to apply both. CI runs `pnpm lint:ci` (check-only).

### Windows: line-ending diffs

Git on Windows defaults to checking files out with CRLF (`\r\n`) line endings, but Biome and Prettier always write LF (`\n`). After running `pnpm lint`, files can show as modified even though Git will normalize them back to LF when staged — so the change wouldn't actually land in a commit.

To clear the noise, pick one:

- One-off: `git add --all`. Staging normalizes the line endings and the entries drop out of `git status`.
- Permanent: `git config --global core.autocrlf input`, then `git checkout -- .` to convert your working tree to LF. Future checkouts won't reintroduce CRLF.

## Getting Help

If you have questions or need help, please:

1. Check the documentation links above
2. Open a [GitHub Issue](https://github.com/namehash/ensnode/issues) for bugs/features
3. Join our community discussions on [GitHub](https://github.com/namehash/ensnode)
4. Join our community on [Telegram](http://t.me/ensnode)

We look forward to your contributions!
