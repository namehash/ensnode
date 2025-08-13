/**
 * Drizzle ORM exporter for database exports
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { promises as fs } from 'fs';
import path from 'path';
import { BaseExporter, ExportConfig, ExportResult, getFileExtension } from './base-exporter.js';
import { tableSchemas, TableName } from '../schema-adapter.js';

export class DrizzleExporter extends BaseExporter {
  private sql: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor(config: ExportConfig) {
    super(config);
    this.sql = postgres(config.connectionString);
    this.db = drizzle(this.sql);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Drizzle connection failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  async exportTable(schema: string, table: string): Promise<ExportResult> {
    const startTime = Date.now();

    // Create output directory if it doesn't exist
    await fs.mkdir(this.config.outputDir, { recursive: true });
    
    const filename = `${schema}_${table}${getFileExtension(this.config.format, this.config.compression)}`;
    const filePath = path.join(this.config.outputDir, filename);

    let rowCount = 0;

    // For custom schemas or tables not in our predefined schema, use raw SQL
    const useRawSQL = schema !== 'public' || !(table in tableSchemas);

    switch (this.config.format) {
      case 'json':
        rowCount = useRawSQL 
          ? await this.exportTableJSONRaw(schema, table, filePath)
          : await this.exportTableJSON(table as TableName, filePath);
        break;
      case 'csv':
        rowCount = useRawSQL
          ? await this.exportTableCSVRaw(schema, table, filePath) 
          : await this.exportTableCSV(table as TableName, filePath);
        break;
      default:
        throw new Error(`Format ${this.config.format} not yet implemented for Drizzle exporter`);
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

  // Raw SQL methods for custom schemas
  private async exportTableJSONRaw(schema: string, table: string, filePath: string): Promise<number> {
    const tableRef = `"${schema}"."${table}"`;
    const data = await this.sql.unsafe(`SELECT * FROM ${tableRef}`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data.length;
  }

  private async exportTableCSVRaw(schema: string, table: string, filePath: string): Promise<number> {
    const tableRef = `"${schema}"."${table}"`;
    const data = await this.sql.unsafe(`SELECT * FROM ${tableRef}`);
    
    if (data.length === 0) {
      await fs.writeFile(filePath, '');
      return 0;
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    
    // Create CSV content
    const csvHeader = columns.join(',') + '\n';
    const csvRows = data.map(row => 
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
    return data.length;
  }

  // Predefined schema methods (for 'public' schema with known tables)
  private async exportTableJSON(tableName: TableName, filePath: string): Promise<number> {
    const schema = tableSchemas[tableName];
    const data = await this.db.select().from(schema);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data.length;
  }

  private async exportTableCSV(tableName: TableName, filePath: string): Promise<number> {
    const schema = tableSchemas[tableName];
    const data = await this.db.select().from(schema);
    
    if (data.length === 0) {
      await fs.writeFile(filePath, '');
      return 0;
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    
    // Create CSV content
    const csvHeader = columns.join(',') + '\n';
    const csvRows = data.map(row => 
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
    return data.length;
  }

  // Additional Drizzle-specific methods
  async getTableRowCount(schema: string, table: string): Promise<number> {
    if (schema === 'public' && table in tableSchemas) {
      // Use Drizzle ORM for predefined tables
      const tableSchema = tableSchemas[table as TableName];
      const result = await this.db.select().from(tableSchema);
      return result.length;
    } else {
      // Use raw SQL for custom schemas
      const tableRef = `"${schema}"."${table}"`;
      const result = await this.sql.unsafe(`SELECT COUNT(*) as count FROM ${tableRef}`);
      return parseInt(String(result[0].count));
    }
  }

  async testQueryPerformance(schema: string, table: string, iterations = 3): Promise<{
    avgTimeMs: number;
    rowCount: number;
  }> {
    const times: number[] = [];
    let rowCount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      if (schema === 'public' && table in tableSchemas) {
        // Use Drizzle ORM for predefined tables
        const tableSchema = tableSchemas[table as TableName];
        const result = await this.db.select().from(tableSchema);
        if (i === 0) rowCount = result.length;
      } else {
        // Use raw SQL for custom schemas
        const tableRef = `"${schema}"."${table}"`;
        const result = await this.sql.unsafe(`SELECT * FROM ${tableRef}`);
        if (i === 0) rowCount = result.length;
      }
      
      const time = Date.now() - start;
      times.push(time);
    }

    return {
      avgTimeMs: times.reduce((a, b) => a + b) / times.length,
      rowCount
    };
  }

  // Method to get actual tables from database
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
} 
