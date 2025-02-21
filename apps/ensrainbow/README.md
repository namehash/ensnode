# ENSRainbow

ENSRainbow is an ENSNode sidecar service for healing ENS labels. It provides a simple API endpoint to heal ENS labelhashes back to their original labels.

## Architecture Overview

For backwards compatibility with the ENS Subgraph, the current rainbow tables (6.37 GB) are exactly the same as those published by [The Graph](https://github.com/graphprotocol/ens-rainbow) which are [MIT licensed](https://bucket.ensrainbow.io/THE_GRAPH_LICENSE.txt).

- **Storage Layer**: Uses LevelDB as an embedded key-value store to efficiently map labelhashes to their original labels
- **API Layer**: Exposes a REST API endpoint that accepts labelhashes and returns the corresponding original label
- **Data Ingestion**: Processes a pre-computed rainbow table (SQL dump) to populate the LevelDB store
- **Performance**: Provides fast, constant-time lookups for known ENS labels through LevelDB's efficient indexing

The service is designed to be run as a sidecar alongside ENSNode, helping to "heal" the labelhashes of unknown labels by finding their original labels when available.

### Current Release & Future Direction

The initial release of ENSRainbow focuses on backwards compatibility with the ENS Subgraph, providing the same label healing capabilities that ENS ecosystem tools rely on today. However, we're actively working on significant enhancements that will expand ENSRainbow's healing capabilities far beyond what's currently possible with the ENS Subgraph. These upcoming features will allow ENSRainbow to heal many previously unknown labels, making it an even more powerful tool for ENS data analysis and integration.

## API Endpoints
See [https://www.ensrainbow.io/reference/using-ensrainbow](https://www.ensrainbow.io/reference/using-ensrainbow)

## Namehash Labs Hosted Instances
See [https://www.ensrainbow.io/reference/hosted-ensrainbow-instances](https://www.ensrainbow.io/reference/hosted-ensrainbow-instances)

## Command Line Interface

ENSRainbow provides a command-line interface (CLI) for managing the service. You can view detailed help for any command by adding `--help` after the command:

```bash
pnpm ingest --help     # Show help for the ingest command
pnpm validate --help   # Show help for the validate command
pnpm serve --help      # Show help for the serve command
```

### Key Commands

#### Data Ingestion
```bash
pnpm run ingest [--input-file path/to/ens_names.sql.gz] [--data-dir path/to/db]
```

`input-file`: Path to the gzipped [SQL dump file containing ENS rainbow tables](#getting-the-rainbow-tables) (default: './ens_names.sql.gz'). Only used during data ingestion.

`data-dir`: Directory for the LevelDB database. If not provided, defaults to `data/`

Ingests the rainbow table data into LevelDB. The process will exit with:
- Code 0: Successful ingestion
- Code 1: Error during ingestion

#### Database Validation
```bash
pnpm run validate [--data-dir path/to/db]
```
Validates the database integrity by:
- Verifying the keys for all rainbow records are valid labelhashes
- Ensuring stored labels match their corresponding labelhashes
- Validating the total rainbow record count
- Verifying no ingestion was interrupted before successful completion

The process will exit with:
- Code 0: Validation successful
- Code 1: Validation failed or errors encountered

#### Database Purge
```bash
pnpm run purge [--data-dir path/to/db]
```
Completely removes all files from the specified data directory. This is useful when you need to start fresh with a clean database.

The process will exit with:
- Code 0: Successful purge
- Code 1: Error during purge operation

#### API Server
```bash
pnpm run serve [--port 3223] [--data-dir path/to/db]
```
Starts the API server. The process will exit with:
- Code 0: Clean shutdown
- Code 1: Error during operation

### Common Options
All commands support these options:
- `--data-dir`: Directory for LevelDB data (default: './data')
- `--log-level`: Logging level: "debug", "info", "warn", "error" (default: "info")

## Getting the Rainbow Tables

Our copies of the original ENS rainbow tables (6.37 GB) are stored in a public bucket.

You can download the rainbow tables using either of these methods:

### Method 1: Using the CLI Command (Recommended)

```bash
pnpm get-legacy-data
```

This command will:
- Download the required files (rainbow tables, checksum, and license)
- Automatically verify the checksum
- Place the files in a convenient directory for subsequent use of the ingest command

### Method 2: Manual Download

If you prefer to download the files manually:

```bash
# Download files
wget https://bucket.ensrainbow.io/ens_names.sql.gz
wget https://bucket.ensrainbow.io/ens_names.sql.gz.sha256sum
wget https://bucket.ensrainbow.io/THE_GRAPH_LICENSE.txt
```

Then verify the checksum:

```bash
# Verify checksum
sha256sum -c ens_names.sql.gz.sha256sum
```

## System Requirements

### Data Ingestion Requirements (`ingest` command)
- **Storage**:
  - At least 15 GB of free disk space:
    - 6.37 GB for the compressed rainbow tables download
    - ~7 GB for the LevelDB database after ingestion
    - Additional temporary space during build/ingestion
- **Memory**: At least 4 GB RAM recommended

### API Server Requirements (`serve` command)
- **Storage**: 7.61 GB for the Docker image (pre-built with LevelDB database)
- **Memory**: Minimum 1 GB RAM (4 GB recommended for optimal performance)
- **CPU**: Minimal requirements - operates well with low CPU resources

## Quick Start with Docker

This section assumes you have already installed Docker on your system.

### Option 1: Using the Pre-built Image (Recommended)

We provide a pre-built Docker image that includes the database already ingested, making it the fastest way to get started:

```bash
docker pull ghcr.io/namehash/ensnode/ensrainbow:latest
docker run -d -p 3223:3223 ghcr.io/namehash/ensnode/ensrainbow:latest
```

The service will be available at `http://localhost:3223`.

### Option 2: Building Your Own Image

If you prefer to build the image yourself (includes data download & ingestion):

1. Build the Docker image:

```bash
# while in the monorepo root directory
docker build -t ensnode/ensrainbow -f apps/ensrainbow/Dockerfile .
```

2. Run the container:

```bash
docker run -d -p 3223:3223 ensnode/ensrainbow
```

The service will be available at `http://localhost:3223`.

## Local Development

1. Ensure you have Node.js v18 or later installed

2. Install dependencies:

```bash
pnpm install
```

3. [Get the Rainbow Tables](#getting-the-rainbow-tables)

4. Run data ingestion and verify the number of unique label-labelhash pairs in the database:

```bash
pnpm run ingest
```

5. Start the service:

```bash
pnpm run serve
```
You can verify the service is running by checking the health endpoint or retrieving the label count:

```bash
# Health check
curl http://localhost:3223/health

# Get count of healable labels
curl http://localhost:3223/v1/labels/count
```

Expected count as of January 30, 2024: 133,856,894 unique label-labelhash pairs

## Service Management

### Graceful Shutdown

The service handles graceful shutdown on SIGTERM and SIGINT signals (e.g., when receiving Ctrl+C or Docker stop commands). During shutdown:

1. The HTTP server stops accepting new connections
2. The database is properly closed to prevent data corruption
3. The process exits with appropriate status code (0 for success, 1 for errors)

### Database Management
If you need to start fresh with the database:
1. Stop any running ENSRainbow processes
2. Delete the LevelDB data directory (default: './data')
3. Run the ingest command again

## Special Thanks

Special thanks to [The Graph](https://thegraph.com/) for their work to generate the [original ENS rainbow table](https://github.com/graphprotocol/ens-rainbow) and [ENS Labs](https://www.enslabs.org/) for developing the [ENS Subgraph](https://github.com/ensdomains/ens-subgraph).

## License

Licensed under the MIT License, Copyright © 2023-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
