# ENSNode Documentation

[docs.ensnode.io](https://docs.ensnode.io) runs on [Mintlify](https://mintlify.com).

Learn more about [ENSNode](https://ensnode.io) from [the "Starlight" ENSNode docs](https://ensnode.io/docs/). Everything from these "Starlight" docs is planned to be transitioned into these Mintlify docs soon.

## API Docs

This Mintlify site serves two (potentially distinct) sets of API docs from two sources:

| Section              | Source             | Purpose                                     |
| -------------------- | ------------------ | ------------------------------------------- |
| **API Reference**    | Production API URL | Always reflects the live deployed API       |
| **Preview** (hidden) | `./openapi.json`   | PR preview deployments for upcoming changes |

When you change API routes or schemas, update the committed `openapi.json` to preview changes in Mintlify's PR deployments.

## OpenAPI Spec Management

We use a combination of runtime URLs and committed files to keep API docs in sync across environments. This setup achieves:

- Production API docs match the production deployment, even when production lags behind `main`
- Non-API docs stay in sync with `main` through normal Git flow
- Each branch has its own `openapi.json`, validated by the CI to be in sync with the `openapi.json` that would actually be returned by the code for ENSApi in the same branch.
- PR previews show upcoming API changes before merge

### Generating the Spec

```bash
pnpm openapi:generate http://localhost:3223
```

The URL argument is required — there is no default to avoid accidentally generating from the wrong source.

### CI Validation

CI runs an `openapi-sync-check` job that compares the committed `openapi.json` against production. If they differ, the check fails.

Update the committed spec when:

- You've changed API routes or schemas (generate from your local instance)
- Production was updated (generate from production)

## Local Development

### Getting Started

1. `git clone https://github.com/namehash/ensnode.git`
2. `cd docs/docs.ensnode.io`
3. `pnpm mint dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Troubleshooting

- If a page loads as a 404, ensure you're running in a folder with a valid `docs.json`
- Run `pnpm mint --help` for more Mintlify CLI details

## Publishing Changes

Changes pushed to the main branch are automatically deployed to production.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [ENSNode "Starlight" docs](https://ensnode.io/docs/)
