# enscli

An agent- and human-friendly CLI for ENS, wrapping [`enssdk`](https://www.npmjs.com/package/enssdk) and the ENS Omnigraph.

```bash
# Query the Omnigraph (defaults to the NameHash-hosted mainnet instance)
npx enscli ensnode omnigraph '{ domain(by: { name: "vitalik.eth" }) { owner { address } } }'

# Explore the schema offline
npx enscli ensnode omnigraph schema Domain

# Hashing
npx enscli namehash vitalik.eth
npx enscli labelhash vitalik
```

Outputs JSON when piped and a pretty form in a TTY. Read-only.

See the [enscli documentation](https://ensnode.io/docs/integrate/integration-options/enscli) for the full command reference, namespaces, and configuration.
