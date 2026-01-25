# ENSNode Documentation

[docs.ensnode.io](https://docs.ensnode.io) runs on [Mintlify](https://mintlify.com).

Learn more about [ENSNode](https://ensnode.io) from [the "Starlight" ENSNode docs](https://ensnode.io/docs/). Everything from these "Starlight" docs is planned to be transitioned into these Mintlify docs soon.

## Local Development

1. `git clone https://github.com/namehash/ensnode.git`
2. `cd docs/docs.ensnode.io`
3. `pnpm mint dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Troubleshooting

- If a page loads as a 404, ensure you're running in a folder with a valid `docs.json`
- Run `pnpm mint --help` for more Mintlify CLI details

## Deployments

Mintlify deploys automatically: preview deploys on each branch, production deploys on merge to `main`.

| Content Type      | Source             | Behavior                                    |
| ----------------- | ------------------ | ------------------------------------------- |
| **API Reference** | Production API URL | Always in sync with deployed production API |
| **Other docs**    | Committed files    | Deploys immediately on merge to main        |

Non-API documentation (guides, concepts, etc.) may be published before the corresponding code is released to production. The API Reference always reflects the actual production API since Mintlify fetches it from the production URL at build time.

To avoid documenting unreleased features:

1. **Keep documentation PRs separate from code PRs**
2. **Merge documentation PRs only after the corresponding code is deployed to production**

## API Reference

The API Reference is generated from an OpenAPI spec. In production, Mintlify fetches this from the live API URL. For PR previews, Mintlify uses the committed `openapi.json` file.

### Generating the Spec

To generate the OpenAPI spec, start ENSApi and run the generator:

```bash
# Start ENSApi in OpenAPI generate mode (no external dependencies required)
OPENAPI_GENERATE_MODE=true pnpm --filter ensapi start

# In another terminal, generate the spec
pnpm --filter @docs/mintlify openapi:generate http://localhost:4334
```

The URL argument is required — there is no default to avoid accidentally generating from the wrong source.

### CI Validation

CI runs an `openapi-sync-check` job that validates the committed `openapi.json` matches what ENSApi generates. Update the committed spec when you change API routes or schemas.

### Environment Switch

When switching production environments (green/blue), the `deploy_switch_ensnode_environment` workflow triggers a Mintlify rebuild to fetch the latest OpenAPI spec from the production API.

This requires `MINTLIFY_API_TOKEN` to be configured as a repository secret and `MINTLIFY_PROJECT_ID` to be configured as a repository variable.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [ENSNode "Starlight" docs](https://ensnode.io/docs/)
