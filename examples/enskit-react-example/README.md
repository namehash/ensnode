# enskit React Example

A minimal React app demonstrating how to use `enskit` and `enssdk` to query the ENS Omnigraph API.

The app connects to a local ENSNode instance and includes demos for browsing domains, registry cache usage, and paginated queries.

## Usage (with NameHash Hosted Instance)

```sh
# from the ENSNode monorepo root
pnpm install

# set the ENSNODE_URL to a NameHash Hosted Instance and run this example in dev mode
ENSNODE_URL=https://api.alpha.ensnode.io pnpm -F enskit-react-example dev
```

## Usage (with Local ENSNode)

First, follow the [ENSNode Contributing Documentation](https://ensnode.io/docs/contributing) to get ENSNode running on your local machine. At the end of this, ENSApi should be available on port `:4334`.

```sh
# from the ENSNode monorepo root
pnpm install

# run this example in dev mode, defaults to connecting to an ENSApi at http://localhost:4334
pnpm -F enskit-react-example dev
```
