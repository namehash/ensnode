# ENSLabelHealer

Permissioned on-chain label emitter for unresolved ENS labels.

Some ENS registry contracts emit events containing only a labelhash, without the plaintext label. This applies to both the original ENS Registry and ENS Registry With Fallback flows. `ENSLabelHealer` lets trusted submitters publish labels on-chain via `LabelHealed(string label)`.

## Prerequisites

Install [Foundry](https://book.getfoundry.sh/getting-started/installation):

After cloning the repo, pull the submodules:

```bash
git submodule update --init --recursive contracts/
```

## Environment

Copy `.env.example` and fill in the values:

```bash
cp .env.example .env
```

## Development

All commands run from `contracts/ens-label-healer/`.

### Build

```bash
forge build
```

### Test

```bash
# Run all tests (unit + fuzz + invariant)
forge test -vvv

# Run a single test file
forge test --match-path test/ENSLabelHealer.t.sol -vvv

# Run a single test by name
forge test --match-test test_submit_emitsLabelHealed -vvv
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

The deploy script (`script/Deploy.s.sol`) deploys `ENSLabelHealer` behind a UUPS proxy. It reads `OWNER_ADDRESS` from the environment.

The grant script (`script/Grant.s.sol`) grants submitter permissions on an existing proxy.
The revoke script (`script/Revoke.s.sol`) revokes submitter permissions on an existing proxy.

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

Grant submitter access:

```bash
PROXY_ADDRESS=<proxy address from deployment> \
SUBMITTER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
forge script script/Grant.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Note the proxy address printed by deployment for manual testing.

#### Manual testing with cast

```bash
export PROXY=<proxy address from above>
export SUBMITTER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Submit a label
cast send $PROXY "submit(string)" "vitalik" \
  --private-key $SUBMITTER_KEY \
  --rpc-url http://localhost:8545

# Read the emitted event
cast logs --rpc-url http://localhost:8545 \
  --address $PROXY \
  "LabelHealed(string)"
```

### Sepolia testnet

**Current deployment:**

|          |                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Proxy    | `0xEd1D2d2F79EC4De1ACcc648a6F2aD1366cB846C0`                                                            |
| Explorer | [sepolia.etherscan.io](https://sepolia.etherscan.io/address/0xEd1D2d2F79EC4De1ACcc648a6F2aD1366cB846C0) |
| Sourcify | [repo.sourcify.dev](https://repo.sourcify.dev/11155111/0xEd1D2d2F79EC4De1ACcc648a6F2aD1366cB846C0)      |


```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

Then allow a submitter. Requires `PROXY_ADDRESS` and `SUBMITTER_ADDRESS` ENV:

```bash
forge script script/Grant.s.sol \
  --rpc-url sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

To revoke a submitter:

```bash
forge script script/Revoke.s.sol \
  --rpc-url sepolia \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

### Mainnet

Always do a dry-run first (drop `--broadcast`) to simulate the deployment and review expected transactions:

```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url mainnet \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Then broadcast:

```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url mainnet \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```
