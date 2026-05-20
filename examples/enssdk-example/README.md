# enssdk Example

A minimal TypeScript script demonstrating how to use `enssdk` to query the ENS Omnigraph API.

Companion to the [enssdk integration guide](https://ensnode.io/docs/integrate/integration-options/enssdk).

## Usage (with NameHash Hosted Instance)

> **Version compatibility:** Our hosted ENSNode instances currently run ENSNode v1.13. If you are querying them from your own app, you **must** use `enssdk@1.13.1`. The latest published version (`1.14.0+`) contains breaking changes in the Omnigraph API data model not yet deployed to our hosted infrastructure. This notice will be removed once the hosted instances are upgraded.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=https://api.alpha.ensnode.io pnpm -F enssdk-example start
````

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

ENSNODE_URL=http://localhost:4334 pnpm -F enssdk-example start
```
