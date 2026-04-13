# ENSNode Documentation

[docs.ensnode.io](https://docs.ensnode.io) runs on [Mintlify](https://mintlify.com).

Learn more about [ENSNode](https://ensnode.io) from [the "Starlight" ENSNode docs](https://ensnode.io/docs). Everything from these "Starlight" docs is planned to be transitioned into these Mintlify docs soon.

## Local Development

1. `git clone https://github.com/namehash/ensnode.git`
2. `cd ensnode`
3. `cd docs/docs.ensnode.io`
4. `pnpm mint dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Regenerating the OpenAPI Spec

The ENSApi OpenAPI spec (`ensapi-openapi.json`) is generated from the route definitions in `apps/ensapi`. To regenerate it after making changes to route schemas:

```sh
pnpm generate:openapi
```

This runs from the repo root and outputs the formatted spec to `docs/docs.ensnode.io/ensapi-openapi.json`.

### Troubleshooting

- If a page loads as a 404, make sure you are running in a folder with a valid `docs.json`.
- Run `pnpm mint --help` to read more details about Mintlify CLI.

## Publishing Changes

Changes pushed to the main branch are automatically deployed to production.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [ENSNode "Starlight" docs](https://ensnode.io/docs)
