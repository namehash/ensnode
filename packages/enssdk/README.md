# enssdk

The foundational ENS developer library. Isomorphic, tree-shakable, with composable modules via subpath exports.

Learn more about [ENSNode](https://ensnode.io/) from [the ENSNode docs](https://ensnode.io/docs).

## Installation

```bash
npm install enssdk
```

> **Version compatibility:** Our hosted ENSNode instances currently run ENSNode v1.13. If you are querying them from your own app, you **must** use `enssdk@1.13.1`. The latest published version (`1.14.0+`) contains breaking changes in the Omnigraph API data model not yet deployed to our hosted infrastructure. This notice will be removed once the hosted instances are upgraded.
>
> ```bash
> npm install enssdk@1.13.1
> ```

## Usage

### Core Client

```typescript
import { createEnsNodeClient } from "enssdk/core";

const client = createEnsNodeClient({ url: "https://api.alpha.ensnode.io" });
```

### Omnigraph (Typed GraphQL)

```typescript
import { createEnsNodeClient } from "enssdk/core";
import { omnigraph, graphql } from "enssdk/omnigraph";

const client = createEnsNodeClient({ url: "https://api.alpha.ensnode.io" }).extend(omnigraph);

const MyQuery = graphql(`
  query MyQuery($name: Name!) {
    domain(by: { name: $name }) {
      canonical {
        name {
          interpreted
        }
      }
      registration {
        expiry
      }
    }
  }
`);

const result = await client.omnigraph.query({
  query: MyQuery,
  variables: { name: "nick.eth" },
});
```

Modules are composable via `extend()` — only import what you use.

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
