# ENSNameHealer

On-chain oracle for healing unresolvable ENS names.

ENSv1's old registry contract emits events with a namehash only — no label string. This contract lets trusted submitters publish the human-readable name behind a namehash. It emits `NameHealed(namehash, name, submitter)` events that any indexer can consume to recover the readable form of an otherwise unresolvable name.

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

Load the env before running `forge` commands:

```bash
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
forge test --match-test test_submit_revertsOnDuplicate -vvv
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

The deploy script (`script/Deploy.s.sol`) deploys `ENSNameHealer` behind a UUPS proxy. It reads `ADMIN_ADDRESS` from the environment and optionally grants `SUBMITTER_ROLE` if `SUBMITTER_ADDRESS` is set.

### Local devnet (Anvil)

Start a local chain in a separate terminal:

```bash
anvil
```

Deploy using Anvil's pre-funded account 0:

```bash
ADMIN_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
SUBMITTER_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Note the proxy address printed by the script — you'll need it for manual testing.

#### Manual testing with cast

```bash
export PROXY=<proxy address from above>
export SUBMITTER_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Submit a name
cast send $PROXY "submit(string)" "vitalik.eth" \
  --private-key $SUBMITTER_KEY \
  --rpc-url http://localhost:8545

# Read the emitted event
cast logs --rpc-url http://localhost:8545 \
  --address $PROXY \
  "NameHealed(bytes32,string,address)"

# Check if a name is already healed
cast call $PROXY "healed(bytes32)(bool)" \
  $(cast keccak $(cast abi-encode "f(string)" "vitalik.eth")) \
  --rpc-url http://localhost:8545
```

### Sepolia testnet

**Current deployment:**

|          |                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Proxy    | `0x4a4e5632EBa282A2c2c48aB442D7208dfC280E45`                                                                        |
| Explorer | [eth-sepolia.blockscout.com](https://eth-sepolia.blockscout.com/address/0x4a4e5632EBa282A2c2c48aB442D7208dfC280E45) |
| Sourcify | [repo.sourcify.dev](https://repo.sourcify.dev/11155111/0x4a4e5632EBa282A2c2c48aB442D7208dfC280E45)                  |

To deploy a new instance, get Sepolia ETH from a faucet (e.g. [sepoliafaucet.com](https://sepoliafaucet.com)), then:

```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier sourcify
```

`--verify` uploads the source to Etherscan so you can interact with the contract via the web UI.

### Mainnet

Always do a dry-run first (drop `--broadcast`) to simulate the deployment and review expected transactions:

```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

Then broadcast:

```bash
source .env && forge script script/Deploy.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```
