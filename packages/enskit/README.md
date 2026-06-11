# enskit

The React toolkit for ENSv2 development. Provides typed Omnigraph API hooks, providers, and utilities powered by [`urql`](https://nearform.com/open-source/urql/) and [`gql.tada`](https://gql-tada.0no.co/).

This package name is reserved for the [ENSNode](https://ensnode.io) project by [NameHash Labs](https://namehashlabs.org).

For more information, visit [ensnode.io](https://ensnode.io).

## Installation

```bash
npm install enskit enssdk
```

> **Version compatibility:** Our hosted ENSNode instances currently run ENSNode v1.15. If you are querying them from your own app, pin `enskit` and `enssdk` to the matching version — the Omnigraph API data model can change between versions.
>
> ```bash
> npm install enskit@1.15.2 enssdk@1.15.2
> ```
