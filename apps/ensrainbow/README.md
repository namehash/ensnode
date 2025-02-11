# ENSRainbow

ENSRainbow is an ENSNode sidecar service for healing ENS labels. It provides a simple API endpoint to heal ENS labelhashes back to their original labels.

Special thanks to [The Graph](https://thegraph.com/) for their work to generate the [original ENS rainbow table](https://github.com/graphprotocol/ens-rainbow) used in the [ENS Subgraph](https://github.com/ensdomains/ens-subgraph).

## Prerequisites

- Docker installed on your system
- Node.js v20 or later (for local development)

## System Requirements

- **Storage**:
  - At least 15 GB of free disk space:
    - 6.37 GB for the compressed rainbow tables download
    - ~7 GB for the LevelDB database after ingestion
    - Additional temporary space during build/ingestion
- **Memory**: Minimum 4 GB RAM recommended for optimal performance
- **Docker**: The final Docker image size is 7.61 GB due to the included LevelDB database

## Architecture Overview

For backwards compatibility with the ENS Subgraph, the current rainbow tables (6.37 GB) are exactly the same as those published by [The Graph](https://github.com/graphprotocol/ens-rainbow) which are [MIT licensed](https://bucket.ensrainbow.io/THE_GRAPH_LICENSE.txt).

- **Storage Layer**: Uses LevelDB as an embedded key-value store to efficiently map labelhashes to their original labels
- **API Layer**: Exposes a REST API endpoint that accepts labelhashes and returns the corresponding original label
- **Data Ingestion**: Processes a pre-computed rainbow table (SQL dump) to populate the LevelDB store
- **Performance**: Provides fast, constant-time lookups for known ENS labels through LevelDB's efficient indexing

The service is designed to be run as a sidecar alongside ENSNode, helping to "heal" the labelhashes of unknown labels by finding their original labels when available.

### Current Release & Future Direction

The initial release of ENSRainbow focuses on backwards compatibility with the ENS Subgraph, providing the same label healing capabilities that ENS ecosystem tools rely on today. However, we're actively working on significant enhancements that will expand ENSRainbow's healing capabilities far beyond what's currently possible with the ENS Subgraph. These upcoming features will allow ENSRainbow to heal many previously unknown labels, making it an even more powerful tool for ENS data analysis and integration.

## Getting the Rainbow Tables

Our copies of the original ENS rainbow tables (6.37 GB) are stored in a public bucket. To download them:

1. Download the original ENS rainbow tables and verify checksum:

```bash
# Download files
wget https://bucket.ensrainbow.io/ens_names.sql.gz
wget https://bucket.ensrainbow.io/ens_names.sql.gz.sha256sum

# Verify checksum
sha256sum -c ens_names.sql.gz.sha256sum
```

## Quick Start with Docker

1. Build the Docker image (includes data ingestion):

```bash
# while in the monorepo root directory
docker build -t ensnode/ensrainbow -f apps/ensrainbow/Dockerfile .
```

2. Run the container:

```bash
docker run -d -p 3001:3001 ensnode/ensrainbow
```

The service will be available at `http://localhost:3001`.

## NameHash Labs Hosted Instance

NameHash Labs operates a freely available instance of ENSRainbow for the ENS community at https://api.ensrainbow.io. This service:

- Is provided free of charge with no API key required
- Has no rate limiting
- Is maintained and monitored by the NameHash Labs team
- Runs the latest version of ENSRainbow

### Using the Hosted Instance

Simply replace `localhost:3001` with `api.ensrainbow.io` in the API examples:

```bash
# Health check
curl https://api.ensrainbow.io/health

# Heal a label
curl https://api.ensrainbow.io/v1/heal/0x[labelhash]

# Get count of healable labels
curl https://api.ensrainbow.io/v1/labels/count
```

While we aim for high availability, if you need guaranteed uptime or want to keep your requests private, we recommend running your own instance using the instructions above.

## API Endpoints

### Health Check

```bash
curl http://localhost:3001/health
```

Response: `{"status":"ok"}`

### Heal Label

```bash
curl http://localhost:3001/v1/heal/0x[labelhash]
```

Example:

```bash
curl http://localhost:3001/v1/heal/0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc
```

Response:
```json
{
  "status": "success",
  "label": "vitalik"
}
```

Note on returned labels: The service returns labels exactly as they appear in the source data. This means:

- Labels may or may not be ENS-normalized
- Labels can contain any valid string, including dots, null bytes, or be empty
- Clients should handle all possible string values appropriately

Error Responses:

- `400 Bad Request`: When the labelhash parameter is missing or invalid
  ```json
  {
    "status": "error",
    "error": "Invalid labelhash - must be a valid hex string",
    "errorCode": 400
  }
  ```

- `404 Not Found`: When no label is found for the given labelhash
  ```json
  {
    "status": "error",
    "error": "Label not found",
    "errorCode": 404
  }
  ```

- `500 Internal Server Error`: When an unexpected error occurs or database is not initialized
  ```json
  {
    "status": "error",
    "error": "Internal server error",
    "errorCode": 500
  }
  ```

### Get Count of Healable Labels

```bash
curl http://localhost:3001/v1/labels/count
```

Success Response:
```json
{
  "status": "success",
  "count": 133856894,
  "timestamp": "2024-01-30T11:18:56Z"
}
```

Error Response (if database not initialized):
```json
{
  "status": "error",
  "error": "Label count not initialized. Check that the ingest command has been run.",
  "errorCode": 500
}
```

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Run data ingestion (requires ens_names.sql.gz) and verify the number of unique label-labelhash pairs in the database:

```bash
pnpm ingest
```

3. Start the service:

```bash
pnpm serve
```

Note: The steps above use the development mode which runs TypeScript files directly. For production builds:

```bash
# Build TypeScript
pnpm build

# Run with compiled JavaScript
pnpm serve:prod
pnpm ingest:prod
```

You can verify the service is running by checking the health endpoint or retrieving the label count:

```bash
# Health check
curl http://localhost:3001/health

# Get count of healable labels
curl http://localhost:3001/v1/labels/count
```

Expected count as of January 30, 2024: 133,856,894 unique label-labelhash pairs

## Environment Variables

### Server Variables
- `PORT`: Server port (default: 3001)
- `DATA_DIR`: Directory for LevelDB data (default: './data')
- `LOG_LEVEL`: Logging level, one of: "debug", "info", "warn", "error" (default: "info")

### Data Ingestion Variables
- `INPUT_FILE`: Path to the gzipped SQL dump file containing ENS rainbow tables (default: './ens_names.sql.gz'). Only used during data ingestion.

## Service Management

### Graceful Shutdown

The service handles graceful shutdown on SIGTERM and SIGINT signals (e.g., when receiving Ctrl+C or Docker stop commands). During shutdown:

1. The HTTP server stops accepting new connections
2. The database is properly closed to prevent data corruption
3. The process exits with appropriate status code (0 for success, 1 for errors)

## License

Licensed under the MIT License, Copyright © 2023-present [NameHash Labs](https://namehashlabs.org).

See [LICENSE](./LICENSE) for more information.
