# ENSRainbow

ENSRainbow is an ENSNode service for healing ENS labels. It provides a simple API endpoint to heal ENS labelhashes back to their original labels.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/Ddy-Qg?referralCode=HxmgeB)

## Documentation

For detailed documentation and guides, see the [ENSRainbow Documentation](https://ensnode.io/ensrainbow).

### Configuration

- **Environment Config**: Built from environment variables (PORT, DATA_DIR, DB_SCHEMA_VERSION) and validated at module load time.
- **Serve Command Config**: Built from CLI arguments and environment config for the `serve` command. CLI arguments override environment variables. The server builds the public config (GET /v1/config) from the database and command config at startup.

## Special Thanks

Special thanks to [The Graph](https://thegraph.com/) for their work to generate the [original ENS rainbow table](https://github.com/graphprotocol/ens-rainbow) and [ENS Labs](https://www.enslabs.org/) for developing the [ENS Subgraph](https://github.com/ensdomains/ens-subgraph).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
