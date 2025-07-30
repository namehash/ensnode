# ENSDb Inspector

A CLI tool for inspecting ENSNode database schemas and their metadata. This tool helps you understand the structure and content of PostgreSQL databases used by ENSNode services.

## Features

- **Schema Discovery**: Automatically categorize database schemas into:
  - `ponder_sync`: Ponder's internal sync and RPC cache schema
  - `ensdb`: ENS indexer schemas following the ENSNode data model  
  - `unknown`: Other schemas not matching known patterns

- **Schema Analysis**: Get detailed information about individual schemas including:
  - Table counts and sizes
  - Row counts and last modification times
  - ENS-specific metrics (domain counts, latest registrations)
  - Ponder-specific metrics (RPC cache entries)

- **Database Overview**: View overall database statistics including:
  - Total database size and connection info
  - PostgreSQL version and uptime
  - Connection statistics and activity metrics
  - Schema breakdown by type

## Installation

This tool is part of the ENSNode monorepo. Install dependencies:

```bash
pnpm install
```

## Usage

All commands require a PostgreSQL connection string. You can use any of these formats:

```bash
# Basic format
postgresql://username:password@host:port/database

# With options
postgresql://username:password@host:port/database?sslmode=require
```

### List All Schemas

```bash
pnpm run list-schemas --database-url "postgresql://user:pass@localhost:5432/ensnode"
```

This command will:
- Connect to the database
- Discover all user schemas (excluding system schemas)
- Categorize each schema by type
- Display a summary with table counts and sizes

### Get Schema Details

```bash
pnpm run schema-info "schema_name" --database-url "postgresql://user:pass@localhost:5432/ensnode"
```

This command provides detailed information about a specific schema including:
- Schema type and basic statistics
- Table-by-table breakdown with sizes and row counts
- ENS-specific information for ENSDb schemas
- Ponder-specific information for sync schemas

### Get Database Overview

```bash
pnpm run db-info --database-url "postgresql://user:pass@localhost:5432/ensnode"
```

This command shows:
- Database connection and server information
- Overall size and schema count
- PostgreSQL version and uptime
- Connection statistics
- Schema breakdown by type
- Database activity metrics

## Examples

### Connecting to a Local Development Database

```bash
# List schemas in local development database
pnpm run list-schemas --database-url "postgresql://postgres:password@localhost:5432/ensnode"

# Get details about a specific ENS indexer schema
pnpm run schema-info "mainnet_v1" --database-url "postgresql://postgres:password@localhost:5432/ensnode"

# Get overall database info
pnpm run db-info --database-url "postgresql://postgres:password@localhost:5432/ensnode"
```

### Connecting to a Production Database

```bash
# Using environment variable for connection string
export DATABASE_URL="postgresql://user:pass@prod-host:5432/ensnode?sslmode=require"

pnpm run list-schemas --database-url "$DATABASE_URL"
```

## Schema Types

### ponder_sync
Ponder's internal schema containing:
- RPC request/response cache
- Indexing state and metadata
- Sync progress tracking

### ensdb
ENS indexer schemas following the ENSNode data model:
- `domain` table with ENS domain records
- `registration` table with registration events
- `resolver` table with resolver records
- Various ENS-specific event tables

### unknown
Any other schemas that don't match the above patterns.

## Development

### Running in Development

```bash
# Run any command directly with tsx
npx tsx src/cli.ts list-schemas --database-url "..."
npx tsx src/cli.ts schema-info "schema_name" --database-url "..."
npx tsx src/cli.ts db-info --database-url "..."
```

### Testing

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## Technical Details

- Built with TypeScript and Drizzle ORM
- Uses `postgres` client for database connections
- Follows the ENSNode monorepo patterns
- Designed for read-only database inspection

## Troubleshooting

### Connection Issues

- Ensure your PostgreSQL server is running and accessible
- Check that the connection string format is correct
- Verify firewall and network settings allow the connection
- For SSL connections, ensure certificates are properly configured

### Permission Issues

- The tool requires at least read access to `information_schema` and `pg_stat_*` views
- Some database activity metrics require additional permissions

### Schema Recognition

- ENSDb schema detection is based on table name patterns
- If a schema isn't recognized as ENSDb, check that it contains tables like `domain`, `registration`, etc.
- Unknown schemas are still analyzed but without ENS-specific features 
