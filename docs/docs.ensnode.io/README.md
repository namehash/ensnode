# ENSNode Documentation

[docs.ensnode.io](https://docs.ensnode.io) runs on [Mintlify](https://mintlify.com).

Learn more about [ENSNode](https://ensnode.io) from [the "Starlight" ENSNode docs](https://ensnode.io/docs/). Everything from these "Starlight" docs is planned to be transitioned into these Mintlify docs soon.

## OpenAPI Spec

The API reference documentation is generated from the committed `openapi.json` file. CI validates that this file stays in sync with what ENSApi actually generates.

### Generating the Spec

To generate the OpenAPI spec, you need a running ENSApi instance. For local development without external dependencies, use the `OPENAPI_CI_CHECK` mode:

```bash
# Start ENSApi in CI check mode (no external dependencies required)
OPENAPI_CI_CHECK=true pnpm --filter ensapi start

# In another terminal, generate the spec
pnpm --filter @docs/mintlify openapi:generate http://localhost:4334
```

The URL argument is required — there is no default to avoid accidentally generating from the wrong source.

### CI Validation

CI runs an `openapi-sync-check` job that starts ENSApi in `OPENAPI_CI_CHECK` mode and compares the generated spec against the committed `openapi.json`. If they differ, the check fails.

Update the committed spec when you've changed API routes or schemas.

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

### Environment Switch

When switching production environments (green/blue), the `deploy_switch_ensnode_environment` workflow triggers a Mintlify rebuild to pick up the new OpenAPI spec from the production API.

This requires `MINTLIFY_API_TOKEN` and `MINTLIFY_PROJECT_ID` to be configured as repository secrets.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [ENSNode "Starlight" docs](https://ensnode.io/docs/)
