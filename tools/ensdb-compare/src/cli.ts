#!/usr/bin/env node

/**
 * ENSDb Compare CLI Tool
 * 
 * Commands:
 * - export: Export database tables to files
 * - compare: Compare two sets of exported files
 * - benchmark: Benchmark export performance (Drizzle vs PostgreSQL)
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import * as fs from 'fs-extra';
import { promises as fsPromises } from 'fs';
import path from 'path';

import { PostgreSQLExporter } from './exporters/pgsql-exporter.js';
import { DrizzleExporter } from './exporters/drizzle-exporter.js';
import { CopyStreamExporter } from './exporters/copy-stream-exporter.js';
import { FileComparator } from './comparator/file-comparator.js';
import { ComparisonConfig } from './comparator/base-comparator.js';
import { ExportConfig } from './exporters/base-exporter.js';
import { tableNames, TableName } from './schema-adapter.js';

const program = new Command();

program
  .name('ensdb-compare')
  .description('CLI tool to export and compare ENSDb databases')
  .version('0.1.0');

// Export command
program
  .command('export')
  .description('Export database tables to files')
  .requiredOption('-c, --connection <string>', 'PostgreSQL connection string')
  .requiredOption('-o, --output <string>', 'Output directory')
  .option('-s, --schema <string>', 'Database schema name (default: public)', 'public')
  .option('-f, --format <string>', 'Export format: csv, json', 'csv')
  .option('-z, --compression <string>', 'Compression: gzip, brotli, none', 'gzip')
  .option('-e, --exporter <string>', 'Exporter type: pgsql, drizzle, copy-stream', 'pgsql')
  .option('-t, --tables <string>', 'Comma-separated list of tables (default: all)')
  .option('--chunk-size <number>', 'Chunk size for processing', '10000')
  .action(async (options) => {
    const spinner = ora('Starting export...').start();
    
    try {
      const config: ExportConfig = {
        connectionString: options.connection,
        outputDir: options.output,
        format: options.format,
        compression: options.compression === 'none' ? undefined : options.compression,
        chunkSize: parseInt(options.chunkSize),
      };

      // Create exporter
            let exporter;
      switch (options.exporter) {
        case 'drizzle':
          exporter = new DrizzleExporter(config);
          break;
        case 'copy-stream':
          exporter = new CopyStreamExporter(config);
          break;
        case 'pgsql':
        default:
          exporter = new PostgreSQLExporter(config);
          break;
      }

      // Test connection
      spinner.text = 'Testing database connection...';
      const connected = await exporter.testConnection();
      if (!connected) {
        spinner.fail('Failed to connect to database');
        process.exit(1);
      }

      // Determine tables to export
      const schemaName = options.schema;
      let tablesToExport: string[];
      
      if (options.tables) {
        // User specified specific tables
        tablesToExport = options.tables.split(',').map((t: string) => t.trim());
      } else {
        // Auto-discover tables from the database
        spinner.text = 'Discovering tables in database...';
        try {
          tablesToExport = await exporter.getActualTables(schemaName);
          
          if (tablesToExport.length === 0) {
            spinner.fail(`No tables found in schema "${schemaName}"`);
            await exporter.close();
            process.exit(1);
          }
          
          console.log(`\nDiscovered ${tablesToExport.length} tables in "${schemaName}":`);
          tablesToExport.forEach(table => console.log(`  - ${table}`));
          
        } catch (error) {
          spinner.fail('Failed to discover tables');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          await exporter.close();
          process.exit(1);
        }
      }

      spinner.text = `Exporting ${tablesToExport.length} tables...`;
      
      // Export tables
      for (const table of tablesToExport) {
        try {
          spinner.text = `Exporting table: ${table}`;
          const result = await exporter.exportTable(schemaName, table);
          
          console.log(`✓ ${table}: ${result.stats.rowCount} rows, ${formatBytes(result.stats.fileSizeBytes)}, ${result.stats.exportTimeMs}ms`);
        } catch (error) {
          console.log(`✗ ${table}: ${error instanceof Error ? error.message : error}`);
        }
      }

      await exporter.close();
      spinner.succeed('Export completed!');

    } catch (error) {
      spinner.fail('Export failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Benchmark command
program
  .command('benchmark')
  .description('Benchmark export performance (Drizzle vs PostgreSQL)')
  .requiredOption('-c, --connection <string>', 'PostgreSQL connection string')
  .requiredOption('-o, --output <string>', 'Output directory')
  .option('-s, --schema <string>', 'Database schema name (default: public)', 'public')
  .option('-t, --table <string>', 'Table to benchmark (default: domains)', 'domains')
  .option('-i, --iterations <number>', 'Number of iterations', '3')
  .option('-f, --format <string>', 'Export format for comparison', 'csv')
  .action(async (options) => {
    const spinner = ora('Starting benchmark...').start();
    
    try {
      const baseConfig: ExportConfig = {
        connectionString: options.connection,
        outputDir: options.output,
        format: options.format,
        compression: 'gzip',
      };

      const schemaName = options.schema;
      const tableName = options.table;
      const iterations = parseInt(options.iterations);

      console.log(`\nBenchmarking table: "${schemaName}"."${tableName}"`);

      // Let's check what tables actually exist in the database
      spinner.text = 'Checking available tables in database...';
      const testExporter = new PostgreSQLExporter(baseConfig);
      const connected = await testExporter.testConnection();
      
      if (connected) {
        try {
          const actualTables = await testExporter.sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
          `;
          
          console.log('\nActual tables in database:');
          actualTables.forEach((row: any) => {
            const fullName = `"${row.table_schema}"."${row.table_name}"`;
            console.log(`  - ${fullName}`);
          });
          
          await testExporter.close();
        } catch (error) {
          console.log('\nCould not list tables:', error instanceof Error ? error.message : error);
        }
      }

      // Create all three exporters
      const pgsqlExporter = new PostgreSQLExporter(baseConfig);
      const drizzleExporter = new DrizzleExporter(baseConfig);
      const copyStreamExporter = new CopyStreamExporter(baseConfig);

      // Test connections
      spinner.text = 'Testing connections...';
      const pgsqlConnected = await pgsqlExporter.testConnection();
      const drizzleConnected = await drizzleExporter.testConnection();
      const copyStreamConnected = await copyStreamExporter.testConnection();

      if (!pgsqlConnected || !drizzleConnected || !copyStreamConnected) {
        spinner.fail('Connection test failed');
        process.exit(1);
      }

      // Get row count first to verify table exists and has data
      spinner.text = 'Checking table row count...';
      try {
        const tableRef = `"${schemaName}"."${tableName}"`;
        const result = await pgsqlExporter.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
        const rowCount = parseInt(String(result[0].count));
        console.log(`\nTable "${schemaName}"."${tableName}" has ${rowCount.toLocaleString()} rows`);
        
        if (rowCount === 0) {
          spinner.warn('Table is empty - benchmark results may not be meaningful');
        }
      } catch (error) {
        spinner.fail(`Failed to access table "${schemaName}"."${tableName}": ${error instanceof Error ? error.message : error}`);
        await pgsqlExporter.close();
        await drizzleExporter.close();
        process.exit(1);
      }

      // Benchmark PostgreSQL exporter
      spinner.text = `Benchmarking PostgreSQL exporter (${iterations} iterations)...`;
      const pgsqlBenchmark = await pgsqlExporter.benchmarkExport(schemaName, tableName, iterations);

      console.log('\nPostgreSQL results:');
      pgsqlBenchmark.results.forEach((result, i) => {
        console.log(`  Iteration ${i + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.stats.exportTimeMs}ms - ${result.stats.rowCount} rows`);
        if (!result.success) {
          console.log(`    Error: ${result.error}`);
        }
      });

      // Benchmark Drizzle exporter
      spinner.text = `Benchmarking Drizzle exporter (${iterations} iterations)...`;
      const drizzleBenchmark = await drizzleExporter.benchmarkExport(schemaName, tableName, iterations);

      console.log('\nDrizzle results:');
      drizzleBenchmark.results.forEach((result, i) => {
        console.log(`  Iteration ${i + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.stats.exportTimeMs}ms - ${result.stats.rowCount} rows`);
        if (!result.success) {
          console.log(`    Error: ${result.error}`);
        }
      });

      // Benchmark Copy Stream exporter
      spinner.text = `Benchmarking Copy Stream exporter (${iterations} iterations)...`;
      const copyStreamBenchmark = await copyStreamExporter.benchmarkExport(schemaName, tableName, iterations);

      console.log('\nCopy Stream results:');
      copyStreamBenchmark.results.forEach((result, i) => {
        console.log(`  Iteration ${i + 1}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.stats.exportTimeMs}ms - ${result.stats.rowCount} rows`);
        if (!result.success) {
          console.log(`    Error: ${result.error}`);
        }
      });

      await pgsqlExporter.close();
      await drizzleExporter.close();
      await copyStreamExporter.close();

      spinner.succeed('Benchmark completed!');

      // Display results
      console.log('\n' + chalk.bold('Benchmark Results:'));
      
      const benchmarkTable = [
        ['Exporter', 'Avg Time (ms)', 'Min Time (ms)', 'Max Time (ms)', 'Avg Rows/sec', 'Success Rate'],
        [
          'PostgreSQL',
          pgsqlBenchmark.avgTimeMs.toFixed(2),
          pgsqlBenchmark.minTimeMs.toString(),
          pgsqlBenchmark.maxTimeMs.toString(),
          pgsqlBenchmark.results[0]?.stats.rowCount && pgsqlBenchmark.results[0].success ? 
            ((pgsqlBenchmark.results[0].stats.rowCount / pgsqlBenchmark.avgTimeMs) * 1000).toFixed(0) : 'N/A',
          `${pgsqlBenchmark.results.filter(r => r.success).length}/${pgsqlBenchmark.results.length}`
        ],
        [
          'Drizzle',
          drizzleBenchmark.avgTimeMs.toFixed(2),
          drizzleBenchmark.minTimeMs.toString(),
          drizzleBenchmark.maxTimeMs.toString(),
          drizzleBenchmark.results[0]?.stats.rowCount && drizzleBenchmark.results[0].success ?
            ((drizzleBenchmark.results[0].stats.rowCount / drizzleBenchmark.avgTimeMs) * 1000).toFixed(0) : 'N/A',
          `${drizzleBenchmark.results.filter(r => r.success).length}/${drizzleBenchmark.results.length}`
        ],
        [
          'Copy Stream',
          copyStreamBenchmark.avgTimeMs.toFixed(2),
          copyStreamBenchmark.minTimeMs.toString(),
          copyStreamBenchmark.maxTimeMs.toString(),
          copyStreamBenchmark.results[0]?.stats.rowCount && copyStreamBenchmark.results[0].success ?
            ((copyStreamBenchmark.results[0].stats.rowCount / copyStreamBenchmark.avgTimeMs) * 1000).toFixed(0) : 'N/A',
          `${copyStreamBenchmark.results.filter(r => r.success).length}/${copyStreamBenchmark.results.length}`
        ]
      ];

      console.log(table(benchmarkTable));

      // Only compare if both had successful results
      const pgsqlSuccessful = pgsqlBenchmark.results.some(r => r.success);
      const drizzleSuccessful = drizzleBenchmark.results.some(r => r.success);

      if (pgsqlSuccessful && drizzleSuccessful) {
        const speedup = drizzleBenchmark.avgTimeMs / pgsqlBenchmark.avgTimeMs;
        if (speedup > 1) {
          console.log(chalk.green(`\nPostgreSQL is ${speedup.toFixed(2)}x faster than Drizzle`));
        } else {
          console.log(chalk.yellow(`\nDrizzle is ${(1/speedup).toFixed(2)}x faster than PostgreSQL`));
        }
      } else {
        console.log(chalk.red('\nCannot compare - one or both exporters failed'));
        if (pgsqlSuccessful && !drizzleSuccessful) {
          console.log(chalk.blue('Note: Drizzle exporter doesn\'t support custom schemas. PostgreSQL exporter works fine.'));
        }
      }

    } catch (error) {
      spinner.fail('Benchmark failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Compare command
program
  .command('compare')
  .description('Compare two database exports and generate difference reports')
  .requiredOption('-a, --database-a <string>', 'Path to database A export directory')
  .requiredOption('-b, --database-b <string>', 'Path to database B export directory')
  .requiredOption('-o, --output <string>', 'Output file for comparison report')
  .option('-f, --format <string>', 'Report format: json, csv, html', 'json')
  .option('-t, --tables <string>', 'Comma-separated list of tables to compare (default: all)')
  .option('--primary-keys <string>', 'JSON string defining custom primary keys per table')
  .action(async (options) => {
    const spinner = ora('Starting database comparison...').start();
    
    try {
      // Parse custom primary keys if provided
      let primaryKeys: Record<string, string[]> | undefined;
      if (options.primaryKeys) {
        try {
          primaryKeys = JSON.parse(options.primaryKeys);
        } catch (error) {
          spinner.fail('Invalid JSON format for primary keys');
          console.error(chalk.red('Error:'), 'Primary keys must be valid JSON, e.g. \'{"domains":["id"],"accounts":["id"]}\'');
          process.exit(1);
        }
      }

      const config: ComparisonConfig = {
        databaseA: options.databaseA,
        databaseB: options.databaseB,
        outputFile: options.output,
        format: options.format,
        tables: options.tables ? options.tables.split(',').map((t: string) => t.trim()) : undefined,
        primaryKeys
      };

      // Validate directories exist
      try {
        await fsPromises.access(config.databaseA);
        await fsPromises.access(config.databaseB);
      } catch (error) {
        spinner.fail('Export directories not found');
        console.error(chalk.red('Error:'), 'Both database export directories must exist');
        process.exit(1);
      }

      spinner.text = 'Initializing comparator...';
      const comparator = new FileComparator(config);

      spinner.text = 'Comparing databases...';
      const report = await comparator.compareDatabase();

      spinner.succeed('Database comparison completed!');

      // Display summary
      console.log(`\n${chalk.bold('Comparison Summary:')}`);
      console.log(`${chalk.bold('Database A:')} ${report.databaseA}`);
      console.log(`${chalk.bold('Database B:')} ${report.databaseB}`);
      console.log(`${chalk.bold('Tables Compared:')} ${report.summary.tablesCompared}`);
      console.log(`${chalk.bold('Total Differences:')} ${report.summary.totalDifferences}`);
      console.log(`${chalk.bold('Comparison Time:')} ${report.summary.comparisonTimeMs}ms`);

      // Display table-by-table results
      if (report.tableComparisons.length > 0) {
        console.log(`\n${chalk.bold('Table Results:')}`);
        const summaryTable = [
          ['Table', 'Total A', 'Total B', 'Identical', 'Different', 'Only A', 'Only B'],
          ...report.tableComparisons.map(tc => [
            tc.tableName,
            tc.totalRowsA.toString(),
            tc.totalRowsB.toString(),
            chalk.green(tc.identical.toString()),
            tc.differentValues > 0 ? chalk.yellow(tc.differentValues.toString()) : '0',
            tc.rowsInAOnly > 0 ? chalk.blue(tc.rowsInAOnly.toString()) : '0',
            tc.rowsInBOnly > 0 ? chalk.cyan(tc.rowsInBOnly.toString()) : '0'
          ])
        ];
        
        console.log(table(summaryTable));
      }

      console.log(`\n${chalk.bold('Report saved to:')} ${config.outputFile}`);

      // Show warning if there are differences
      if (report.summary.totalDifferences > 0) {
        console.log(chalk.yellow(`\n⚠️  Found ${report.summary.totalDifferences} differences between databases`));
      } else {
        console.log(chalk.green('\n✅ Databases are identical!'));
      }

    } catch (error) {
      spinner.fail('Database comparison failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Info command  
program
  .command('info')
  .description('Get database and table information')
  .requiredOption('-c, --connection <string>', 'PostgreSQL connection string')
  .option('-s, --schema <string>', 'Database schema name (default: public)', 'public')
  .option('-t, --table <string>', 'Specific table to analyze')
  .action(async (options) => {
    const spinner = ora('Connecting to database...').start();
    
    try {
      const config: ExportConfig = {
        connectionString: options.connection,
        outputDir: './temp',
        format: 'csv',
      };

      const exporter = new PostgreSQLExporter(config);
      const connected = await exporter.testConnection();
      
      if (!connected) {
        spinner.fail('Connection failed');
        process.exit(1);
      }

      const schemaName = options.schema;

      if (options.table) {
        // Show specific table info
        spinner.text = `Getting info for table ${schemaName}.${options.table}...`;
        
        try {
          const tableInfo = await exporter.getTableInfo(schemaName, options.table);
          
          await exporter.close();
          spinner.succeed('Table information retrieved!');

          console.log(`\n${chalk.bold('Table:')} "${schemaName}"."${options.table}"`);
          console.log(`${chalk.bold('Rows:')} ${tableInfo.rowCount.toLocaleString()}`);
          
          console.log(`\n${chalk.bold('Columns:')}`);
          const columnTable = [
            ['Name', 'Type', 'Nullable'],
            ...tableInfo.columns.map(col => [col.name, col.type, col.nullable ? 'YES' : 'NO'])
          ];
          console.log(table(columnTable));

          if (tableInfo.indexes.length > 0) {
            console.log(`\n${chalk.bold('Indexes:')}`);
            const indexTable = [
              ['Name', 'Columns', 'Unique'],
              ...tableInfo.indexes.map(idx => [idx.name, idx.columns.join(', '), idx.unique ? 'YES' : 'NO'])
            ];
            console.log(table(indexTable));
          }
        } catch (error) {
          await exporter.close();
          spinner.fail('Failed to get table info');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      } else {
        // Show all tables
        spinner.text = 'Getting database schema...';
        
        try {
          const allTables = await exporter.sql`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
          `;
          
          await exporter.close();
          spinner.succeed('Database schema retrieved!');

          console.log(`\n${chalk.bold('Available Tables:')}`);
          
          const schemaGroups: Record<string, string[]> = {};
          allTables.forEach((row: any) => {
            const schema = row.table_schema;
            if (!schemaGroups[schema]) schemaGroups[schema] = [];
            schemaGroups[schema].push(row.table_name);
          });

          Object.entries(schemaGroups).forEach(([schema, tables]) => {
            console.log(`\n${chalk.yellow(schema)}:`);
            tables.forEach(table => {
              console.log(`  - ${table}`);
            });
          });

          console.log(`\n${chalk.bold('Total tables:')} ${allTables.length}`);
          console.log(`${chalk.bold('Schemas:')} ${Object.keys(schemaGroups).length}`);
        } catch (error) {
          await exporter.close();
          spinner.fail('Failed to get database info');
          console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
          process.exit(1);
        }
      }

    } catch (error) {
      spinner.fail('Info command failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Utility function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Parse and execute
program.parse(); 
