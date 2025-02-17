# ENSRainbow SDK

TypeScript library for interacting with the [ENSRainbow API](https://github.com/namehash/ensnode/tree/main/apps/ensrainbow).

Learn more about [ENSRainbow](https://ensrainbow.io) and [ENSNode](https://ensnode.io).

## API Reference

#### Heal Label
Attempt to heal a labelhash to its original label.

```typescript
const response = await client.heal(
  "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
);

console.log(response);

// Output:
// {
//   status: "success",
//   label: "vitalik"
// }
```

#### Label Count
Get Count of Healable Labels

```typescript
const response = await client.count();

console.log(response);

// {
//   "status": "success",
//   "count": 133856894,
//   "timestamp": "2024-01-30T11:18:56Z"
// }
```

#### Health Check
Simple verification that the service is running, either in your local setup or for the provided hosted instance

```typescript
const response = await client.health();

console.log(response);

// {
//   "status": "ok",
// }
```

### Response Types & Error Handling
Each API endpoint has a designated error type to account for possible mishaps that could occur during a request.

Below is an example of a failed `heal` operation, that shows the resulting error returned by the SDK

```typescript
const notFoundResponse = await client.heal(
  "0xf64dc17ae2e2b9b16dbcb8cb05f35a2e6080a5ff1dc53ac0bc48f0e79111f264"
);

console.log(notFoundResponse);

// Output:
// {
//   status: "error",
//   error: "Label not found",
//   errorCode: 404
// }
```

## Contact Us

Visit our [website](https://namehashlabs.org/) to get in contact.

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
