# ENSRainbow

ENSRainbow is an ENSNode service for healing ENS labels. It provides a simple API endpoint to heal ENS labelhashes back to their original labels.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/Ddy-Qg?referralCode=HxmgeB)

## Documentation

For detailed documentation and guides, see the [ENSRainbow Documentation](https://ensnode.io/ensrainbow).

### Configuration

- **EnvConfig**: from environment variables (PORT, DATA_DIR, DB_SCHEMA_VERSION), validated at startup.
- **ServeCommandConfig**: effective config for the `serve` command: merge of CLI args and EnvConfig; CLI args take precedence. The API builds the public config (GET /v1/config) from ServeCommandConfig.

## Special Thanks

Special thanks to [The Graph](https://thegraph.com/) for their work to generate the [original ENS rainbow table](https://github.com/graphprotocol/ens-rainbow) and [ENS Labs](https://www.enslabs.org/) for developing the [ENS Subgraph](https://github.com/ensdomains/ens-subgraph).

## License

Licensed under the MIT License, Copyright © 2025-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
