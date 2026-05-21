# enskit

The React toolkit for ENSv2 development. Provides typed Omnigraph API hooks, providers, and utilities powered by [`urql`](https://nearform.com/open-source/urql/) and [`gql.tada`](https://gql-tada.0no.co/).

This package name is reserved for the [ENSNode](https://ensnode.io) project by [NameHash Labs](https://namehashlabs.org).

For more information, visit [ensnode.io](https://ensnode.io).

## Installation

```bash
npm install enskit enssdk
```

> **Version compatibility:** Our hosted ENSNode instances currently run ENSNode v1.13. If you are querying them from your own app, you **must** use `enskit@1.13.1` and `enssdk@1.13.1`. The latest published versions (`1.14.0+`) contain breaking changes in the Omnigraph API data model not yet deployed to our hosted infrastructure. This notice will be removed once the hosted instances are upgraded.
>
> ```bash
> npm install enskit@1.13.1 enssdk@1.13.1
> ```
