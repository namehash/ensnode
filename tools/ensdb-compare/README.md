# ENSDb Compare Tool

A high-performance CLI tool for exporting and comparing ENS database contents using both Drizzle ORM and raw PostgreSQL approaches.

## Overview

This tool is designed to handle large ENS databases (100GB+) by providing:
- **Fast database exports** using PostgreSQL COPY commands and binary formats
- **Table-by-table processing** for memory efficiency  
- **Compression support** (gzip, brotli) to reduce file sizes
- **Performance benchmarking** between Drizzle ORM and raw PostgreSQL
- **Database comparison** to identify differences between two ENS databases

## Features

### Export Formats
- **Binary** (fastest, PostgreSQL native format)
- **CSV** (human-readable, compressed)
- **JSON** (structured data, Drizzle only)

### Compression Options
- **gzip** (good compression, fast)
- **brotli** (better compression, slower)
- **none** (fastest export, largest files)

### Exporters
- **PostgreSQL** - Uses chunked SELECT queries for memory efficiency
- **Drizzle** - Uses Drizzle ORM with raw SQL fallback for custom schemas  
- **Copy Stream** - Uses native PostgreSQL `COPY TO STDOUT` for maximum performance

## Installation

```bash
cd tools/ensdb-compare
npm install
npm run build
```

## Usage

### 1. Export Database Tables

Export all tables using PostgreSQL exporter with binary format:
```bash
ensdb-compare export \
  -c "postgresql://user:pass@host:port/dbname" \
  -o ./exports/db_a \
  -f binary \
  -z gzip \
  -e pgsql
```

Export specific tables using Drizzle with JSON format:
```bash
ensdb-compare export \
  -c "postgresql://user:pass@host:port/dbname" \
  -o ./exports/db_b \
  -f json \
  -z gzip \
  -e drizzle \
  -t "domains,accounts,resolvers"
```

### 2. Benchmark Performance

Compare export performance between PostgreSQL and Drizzle:
```bash
ensdb-compare benchmark \
  -c "postgresql://user:pass@host:port/dbname" \
  -o ./benchmark \
  -t domains \
  -i 5
```

### 3. Database Information

Get database table statistics:
```bash
ensdb-compare info \
  -c "postgresql://user:pass@host:port/dbname" \
  -e pgsql
```

### 4. Compare Databases

Compare two sets of exported database files:
```bash
ensdb-compare compare \
  -a ./exports/db_a \
  -b ./exports/db_b \
  -o comparison_report.json \
  -f json
```

Compare specific tables with custom primary keys:
```bash
ensdb-compare compare \
  -a ./exports/db_a \
  -b ./exports/db_b \
  -o comparison_report.html \
  -f html \
  -t "domains,accounts" \
  --primary-keys '{"domains":["id"],"accounts":["id"]}'
```

## Command Options

### Export Command
- `-c, --connection <string>` - PostgreSQL connection string (required)
- `-o, --output <string>` - Output directory (required)
- `-f, --format <string>` - Export format: binary, csv, json (default: binary)
- `-z, --compression <string>` - Compression: gzip, brotli, none (default: gzip)
- `-e, --exporter <string>` - Exporter type: pgsql, drizzle, copy-stream (default: pgsql)
- `-t, --tables <string>` - Comma-separated list of tables (default: all)
- `--chunk-size <number>` - Chunk size for processing (default: 10000)

### Benchmark Command
- `-c, --connection <string>` - PostgreSQL connection string (required)
- `-o, --output <string>` - Output directory (required)
- `-t, --table <string>` - Table to benchmark (default: domains)
- `-i, --iterations <number>` - Number of iterations (default: 3)
- `-f, --format <string>` - Export format for comparison (default: csv)

### Compare Command
- `-a, --database-a <string>` - Path to database A export directory (required)
- `-b, --database-b <string>` - Path to database B export directory (required)
- `-o, --output <string>` - Output file for comparison report (required)
- `-f, --format <string>` - Report format: json, csv, html (default: json)
- `-t, --tables <string>` - Comma-separated list of tables to compare (default: all)
- `--primary-keys <string>` - JSON string defining custom primary keys per table

## Performance Characteristics

### Expected Performance (100GB Database)

| Format | Exporter | Compression | Speed | File Size |
|--------|----------|-------------|-------|-----------|
| CSV | Copy Stream | gzip | **Fastest** | Small |
| CSV | Copy Stream | none | **Fastest** | Medium |
| CSV | PostgreSQL | gzip | Fast | Small |
| CSV | Drizzle | gzip | Fast | Small |
| JSON | Drizzle | gzip | Slower | Medium |

### Recommendations for 100GB Databases

1. **For maximum speed**: Use `csv` format with `copy-stream` exporter and `gzip` compression
2. **For human readability**: Use `csv` format with `pgsql` exporter and `gzip` compression  
3. **For structured data**: Use `json` format with `drizzle` exporter and `gzip` compression
4. **For development/testing**: Use `csv` format with `drizzle` exporter

## Tables Supported

- `domains` - Core ENS domain data
- `accounts` - Account addresses  
- `resolvers` - Resolver contracts and settings
- `registrations` - Domain registration data
- `resolver_address_records` - Address records by coin type
- `resolver_text_records` - Text records by key
- `ext_registration_referral` - Referral tracking data

## Schema Compatibility

This tool includes a "brute force" schema adapter that manually defines table schemas based on the `ensnode-schema` package, working around Ponder-specific functions to ensure compatibility with pure Drizzle ORM.

## Connection String Format

```
postgresql://username:password@hostname:port/database_name
```

Example:
```
postgresql://ensuser:password123@localhost:5432/ensdb
```

## Output Structure

Exported files are organized by table:
```
exports/
├── domains.bin.gz
├── accounts.bin.gz
├── resolvers.bin.gz
├── registrations.bin.gz
├── resolver_address_records.bin.gz
├── resolver_text_records.bin.gz
└── ext_registration_referral.bin.gz
```

## Error Handling

- Connection failures are reported immediately
- Failed table exports continue processing other tables
- Detailed error messages and export statistics
- Graceful handling of missing tables

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev export --help

# Build for production
npm run build

# Run linting
npm run lint
```

## Architecture

The tool is built with a modular architecture:

- `schema-adapter.ts` - Schema definitions and table registry
- `exporters/base-exporter.ts` - Abstract base class and interfaces
- `exporters/pgsql-exporter.ts` - Chunked SELECT implementation
- `exporters/drizzle-exporter.ts` - Drizzle ORM with raw SQL fallback
- `exporters/copy-stream-exporter.ts` - Native PostgreSQL COPY TO STDOUT streaming
- `cli.ts` - Command-line interface and orchestration

## Future Enhancements

- [x] File-based database comparison logic ✅
- [ ] Parallel table exports  
- [ ] Resume capability for interrupted exports
- [ ] Custom SQL query exports
- [ ] Delta/incremental export support
- [ ] Export validation and integrity checks
- [ ] Detailed diff views (field-by-field changes)
- [ ] Performance optimizations for very large datasets
- [ ] Binary file format comparison support 
