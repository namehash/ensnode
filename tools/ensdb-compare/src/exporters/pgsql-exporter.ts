/**
 * PostgreSQL raw exporter using COPY commands for maximum performance
 */

import postgres from 'postgres';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseExporter, ExportConfig, ExportResult, getFileExtension, formatBytes } from './base-exporter.js';

export class PostgreSQLExporter extends BaseExporter {
  public sql: postgres.Sql;

  constructor(config: ExportConfig) {
    super(config);
    this.sql = postgres(config.connectionString);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('PostgreSQL connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  async getActualTables(schema: string): Promise<string[]> {
    const tablesResult = await this.sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ${schema} 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_ponder_%'
      AND table_name NOT LIKE '_reorg_%'
      ORDER BY table_name
    `;
    
    return tablesResult.map((r: any) => r.table_name);
  }

  async exportTable(schema: string, table: string): Promise<ExportResult> {
    const startTime = Date.now();
    
    // Create output directory if it doesn't exist
    await fs.mkdir(this.config.outputDir, { recursive: true });
    
    const filename = `${schema}_${table}${getFileExtension(this.config.format, this.config.compression)}`;
    const filePath = path.join(this.config.outputDir, filename);

    let rowCount = 0;

    switch (this.config.format) {
      case 'csv':
        rowCount = await this.exportTableCSV(schema, table, filePath);
        break;
      case 'json':
        rowCount = await this.exportTableJSON(schema, table, filePath);
        break;
      default:
        throw new Error(`Format ${this.config.format} not yet implemented for PostgreSQL exporter`);
    }

    const exportTimeMs = Date.now() - startTime;
    const stats = await fs.stat(filePath);

    return {
      filePath,
      stats: {
        exportTimeMs,
        rowCount,
        fileSizeBytes: stats.size,
      }
    };
  }

  private async exportTableCSV(schema: string, table: string, filePath: string): Promise<number> {
    // Use chunked SELECT for better memory efficiency with large tables
    const tableRef = `"${schema}"."${table}"`;
    
    // First get row count
    const countResult = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
    const totalRows = parseInt(String(countResult[0].count));
    
    if (totalRows === 0) {
      await fs.writeFile(filePath, '');
      return 0;
    }

    // For small tables (< 50k rows), load all at once for speed
    if (totalRows < 50000) {
      const result = await this.sql.unsafe(`SELECT * FROM ${tableRef}`);
      
      // Get column names from first row
      const columns = Object.keys(result[0]);
      
      // Create CSV content
      const csvHeader = columns.join(',') + '\n';
      const csvRows = result.map(row => 
        columns.map(col => {
          const value = (row as any)[col];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape CSV values that contain commas or quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        }).join(',')
      ).join('\n');

      const csvContent = csvHeader + csvRows;
      await fs.writeFile(filePath, csvContent);
      return result.length;
    }

    // For large tables, use chunked approach to avoid memory issues
    const chunkSize = this.config.chunkSize || 25000;
    let csvContent = '';
    let columns: string[] = [];
    let processedRows = 0;

    for (let offset = 0; offset < totalRows; offset += chunkSize) {
      const chunkResult = await this.sql.unsafe(
        `SELECT * FROM ${tableRef} ORDER BY id LIMIT ${chunkSize} OFFSET ${offset}`
      );
      
      if (chunkResult.length === 0) break;

      // Get column names from first chunk
      if (offset === 0) {
        columns = Object.keys(chunkResult[0]);
        csvContent += columns.join(',') + '\n';
      }

      // Process chunk into CSV rows
      const chunkRows = chunkResult.map(row => 
        columns.map(col => {
          const value = (row as any)[col];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape CSV values that contain commas or quotes
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        }).join(',')
      ).join('\n');

      if (chunkRows) {
        csvContent += chunkRows + '\n';
      }
      processedRows += chunkResult.length;
    }

    await fs.writeFile(filePath, csvContent);
    return processedRows;
  }

  private async exportTableJSON(schema: string, table: string, filePath: string): Promise<number> {
    // For JSON, we need to use SELECT since COPY TO doesn't support JSON format
    // But we can optimize by using chunked reading for large tables
    const tableRef = `"${schema}"."${table}"`;
    
    // Get total row count first
    const countResult = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
    const totalRows = parseInt(String(countResult[0].count));
    
    if (totalRows === 0) {
      await fs.writeFile(filePath, '[]');
      return 0;
    }

    // For small tables (< 10k rows), load all at once
    if (totalRows < 10000) {
      const result = await this.sql.unsafe(`SELECT * FROM ${tableRef}`);
      await fs.writeFile(filePath, JSON.stringify(result, null, 2));
      return result.length;
    }

    // For large tables, use chunked approach
    const chunkSize = this.config.chunkSize || 10000;
    const chunks: any[][] = [];
    
    for (let offset = 0; offset < totalRows; offset += chunkSize) {
      const chunkResult = await this.sql.unsafe(
        `SELECT * FROM ${tableRef} ORDER BY id LIMIT ${chunkSize} OFFSET ${offset}`
      );
      chunks.push(chunkResult);
    }

    const allData = chunks.flat();
    await fs.writeFile(filePath, JSON.stringify(allData, null, 2));
    return allData.length;
  }

  // Additional PostgreSQL-specific methods
  async getTableSize(schema: string, table: string): Promise<{ size: number; rowCount: number }> {
    const tableRef = `"${schema}"."${table}"`;
    const sizeResult = await this.sql.unsafe(`SELECT pg_total_relation_size('${tableRef}') as size`);
    const countResult = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
    
    return {
      size: parseInt(String(sizeResult[0].size)),
      rowCount: parseInt(String(countResult[0].count)),
    };
  }

  async getTableInfo(schema: string, table: string): Promise<{
    columns: Array<{ name: string; type: string; nullable: boolean }>;
    indexes: Array<{ name: string; columns: string[]; unique: boolean }>;
    rowCount: number;
  }> {
    try {
      // Get columns
      const columnsResult = await this.sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = ${schema} AND table_name = ${table}
        ORDER BY ordinal_position
      `;

      // Get indexes
      const indexesResult = await this.sql`
        SELECT 
          i.relname as index_name,
          array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
          ix.indisunique as is_unique
        FROM pg_class t
        JOIN pg_index ix ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = ${schema} AND t.relname = ${table}
        GROUP BY i.relname, ix.indisunique
      `;

      // Get row count
      const tableRef = `"${schema}"."${table}"`;
      const result = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
      const rowCount = parseInt(String(result[0].count));

      return {
        columns: columnsResult.map((r: any) => ({
          name: r.column_name,
          type: r.data_type,
          nullable: r.is_nullable === 'YES'
        })),
        indexes: indexesResult.map((r: any) => ({
          name: r.index_name,
          columns: r.columns,
          unique: r.is_unique
        })),
        rowCount
      };
    } catch (error) {
      throw new Error(`Failed to get table info: ${error instanceof Error ? error.message : error}`);
    }
  }
} 
