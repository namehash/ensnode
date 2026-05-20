<!-- VERTICAL WHITESPACE -->

<br>

<!-- BANNER IMAGE -->

<p align="center">
  <a href="https://ensnode.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/ensnode-banner-dark.svg">
      <img alt="ENSNode" src=".github/assets/ensnode-banner-light.svg" width="auto" height="80">
    </picture>
  </a>
</p>

<!-- VERTICAL WHITESPACE -->

<br>

# ENSNode

[ENSNode](https://ensnode.io) is the full-stack development platform for [ENSv2](https://ens.domains/ensv2). Use ENSNode to achieve full ENSv2 readiness even before ENSv2 launches.

The easiest way to get started is through the new **ENS Omnigraph API** — the world's first and only API to support querying the full state of both ENSv1 and ENSv2 in a single unified API.

- 📚 **Docs:** [ensnode.io](https://ensnode.io)
- 🚀 **Quickstart:** [ensnode.io/docs/integrate](https://ensnode.io/docs/integrate)
- 💬 **Telegram:** [t.me/ensnode](https://t.me/ensnode)

## Example: query the subnames of '.eth' via the ENS Omnigraph API

Note that substantial ENS data is not directly queryable through traditional smart contract RPC calls. Examples include: the subnames of a name, or the names owned by an address. ENSNode is the world's first and only solution that makes the full set of ENS data spanning both ENSv1 and ENSv2 accessible through a single unified API.

```graphql
query HelloWorld {
  domain(by: { name: "eth" }) {
    __typename
    canonical { name { interpreted } }
    owner { address }
    subdomains(first: 20) {
      totalCount
      edges { node { __typename canonical { name { interpreted } } owner { address } } }
    }
  }
}
```

To get started with ENSNode and the ENS Omnigraph API, follow the [Quickstart](https://ensnode.io/docs/integrate).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Sponsors

NameHash has received generous support from the [ENS DAO](https://ensdao.org/) and [Gitcoin](https://www.gitcoin.co/).

<p align="middle">
  <a href="https://ensdao.org/" target="_blank"><img src="./docs/ensnode.io/public/ensdao.png" width="180"></a>
  <a href="https://www.gitcoin.co/" target="_blank" style="text-decoration: none;"><img src="./docs/ensnode.io/public/gitcoin.png" width="180"></a>
</p>

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
