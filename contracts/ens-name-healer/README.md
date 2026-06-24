# ENSNameHealer

Enable healed labels in ENS names to automatically propagate to all decentralized ENSNode instances.

Some ENS registry contracts emit events containing only a labelhash, without the plaintext label. This applies to both the original ENS Registry and ENS Registry With Fallback. See:

- https://ensnode.io/ensrainbow#the-problem-unknown-labels
- https://ensnode.io/ensrainbow/concepts/unknown-labels

`ENSNameHealer` is the sole onchain publisher of discovered label preimages. Healing happens in indexers when they consume `LabelPublished` events — this contract does not heal anything itself.

## Ecosystem roles

1. **Discoverers** — anyone who finds the preimage of an encoded labelhash in indexed ENS data and submits it to ENSRainbowBeam (optionally with attribution).
2. **ENSRainbowBeam** — filters submissions and publishes productive labels through the sole publisher address.
3. **Publisher** — the single address authorized to call `publishLabel` / `publishLabels` on this contract.
4. **ENSNameHealer** — enforces the single-publisher rule and emits `LabelPublished` events.
5. **Indexers** — consume events, compute labelhashes, and heal unknown labels in indexed data.

To pause publishing, the owner sets the publisher to the zero address via `setPublisher`.

## LiteralLabel

All label inputs are `LiteralLabel` values: any possible string, not limited to ENSIP-15 normalized labels. The empty string, strings containing `.`, null bytes, and unnormalizable sequences are all valid.

## Prerequisites

Install [Foundry](https://book.getfoundry.sh/getting-started/installation):

After cloning the repo, pull the submodules:

```bash
git submodule update --init --recursive contracts/
```

## Environment

Copy `.env.example` and fill in the values. Variables are exported so `source .env` passes them to forge:

```bash
cp .env.example .env
# edit .env, then:
source .env
```

## Development

All commands run from `contracts/ens-name-healer/`.

### Build

```bash
forge build
```

### Test

```bash
# Run all tests (unit + fuzz + invariant)
forge test -vvv

# Run a single test file
forge test --match-path test/ENSNameHealer.t.sol -vvv

# Run a single test by name
forge test --match-test test_publishLabel_emitsLabelPublished -vvv
```

### Format

```bash
# Check formatting (used in CI)
forge fmt --check

# Auto-fix formatting
forge fmt
```

### Gas snapshot

```bash
forge snapshot
```

Commit the `.gas-snapshot` file to track gas changes across PRs.

## Deployment

The deploy script (`script/Deploy.s.sol`) deploys `ENSNameHealer` behind a UUPS proxy. It reads `OWNER_ADDRESS` from the environment.

The set-publisher script (`script/SetPublisher.s.sol`) assigns the publisher on an existing proxy.

### Local devnet (Anvil)

Start a local chain in a separate terminal:

```bash
anvil
```

Deploy using Anvil's pre-funded account 0:

```bash
OWNER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Set the publisher:

```bash
PROXY_ADDRESS=<proxy address from deployment> \
PUBLISHER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
forge script script/SetPublisher.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Note the proxy address printed by deployment for manual testing.

#### Manual testing with cast

```bash
export PROXY=<proxy address from above>
export PUBLISHER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Publish a label
cast send $PROXY "publishLabel(string)" "vitalik" \
  --private-key $PUBLISHER_KEY \
  --rpc-url http://localhost:8545

# Read emitted events
cast logs --rpc-url http://localhost:8545 \
  --address $PROXY \
  "LabelPublished(string,address)"
```

### Sepolia testnet

Deploy a fresh proxy after contract API changes; prior Sepolia deployments used the old ABI.

```bash
source .env
forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

Then set the publisher (`PROXY_ADDRESS` and `PUBLISHER_ADDRESS` must be set in `.env`):

```bash
source .env
forge script script/SetPublisher.s.sol \
  --rpc-url sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

To pause publishing, set `PUBLISHER_ADDRESS=0x0000000000000000000000000000000000000000` in `.env` and run `SetPublisher.s.sol` again.

### Mainnet

Always do a dry-run first (drop `--broadcast`) to simulate the deployment and review expected transactions:

```bash
source .env
forge script script/Deploy.s.sol \
  --rpc-url mainnet \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Then broadcast:

```bash
source .env
forge script script/Deploy.s.sol \
  --rpc-url mainnet \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```
