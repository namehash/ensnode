/**
 * File-based comparator for exported database files
 */

import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { createGunzip, createBrotliDecompress } from 'zlib';
import { pipeline } from 'stream/promises';
import path from 'path';
import { 
  BaseComparator, 
  ComparisonConfig, 
  ComparisonReport, 
  TableDifferences, 
  TableComparison,
  FileInfo,
  RecordDifference
} from './base-comparator.js';

export class FileComparator extends BaseComparator {
  constructor(config: ComparisonConfig) {
    super(config);
  }

  async compareDatabase(): Promise<ComparisonReport> {
    const startTime = Date.now();
    
    // Discover tables to compare
    const tablesToCompare = await this.discoverTables();
    
    if (tablesToCompare.length === 0) {
      throw new Error('No matching tables found in both database exports');
    }

    console.log(`Found ${tablesToCompare.length} tables to compare: ${tablesToCompare.join(', ')}`);

    const tableComparisons: TableComparison[] = [];
    const details: TableDifferences[] = [];

    // Compare each table
    for (const tableName of tablesToCompare) {
      console.log(`Comparing table: ${tableName}`);
      
      try {
        const fileA = await this.findTableFile(this.config.databaseA, tableName);
        const fileB = await this.findTableFile(this.config.databaseB, tableName);
        
        const tableDiff = await this.compareTable(tableName, fileA, fileB);
        
        tableComparisons.push(tableDiff.summary);
        details.push(tableDiff);
        
        console.log(`✓ ${tableName}: ${tableDiff.summary.identical} identical, ${tableDiff.summary.differentValues} different, ${tableDiff.summary.rowsInAOnly}+${tableDiff.summary.rowsInBOnly} unique`);
      } catch (error) {
        console.error(`✗ ${tableName}: ${error instanceof Error ? error.message : error}`);
        
        // Add empty comparison for failed table
        const emptyComparison: TableComparison = {
          tableName,
          rowsInAOnly: 0,
          rowsInBOnly: 0,
          differentValues: 0,
          identical: 0,
          totalRowsA: 0,
          totalRowsB: 0,
          comparisonTimeMs: 0
        };
        
        const emptyDifferences: TableDifferences = {
          tableName,
          onlyInA: [],
          onlyInB: [],
          different: [],
          summary: emptyComparison
        };
        
        tableComparisons.push(emptyComparison);
        details.push(emptyDifferences);
      }
    }

    const totalDifferences = tableComparisons.reduce((sum, tc) => 
      sum + tc.rowsInAOnly + tc.rowsInBOnly + tc.differentValues, 0
    );

    const report: ComparisonReport = {
      timestamp: new Date().toISOString(),
      databaseA: this.config.databaseA,
      databaseB: this.config.databaseB,
      summary: {
        tablesCompared: tablesToCompare.length,
        totalDifferences,
        comparisonTimeMs: Date.now() - startTime
      },
      tableComparisons,
      details
    };

    // Generate report file
    await this.generateReport(report);
    
    return report;
  }

  async compareTable(tableName: string, fileA: FileInfo, fileB: FileInfo): Promise<TableDifferences> {
    const startTime = Date.now();
    
    // Load data from both files
    const [dataA, dataB] = await Promise.all([
      this.loadDataFromFile(fileA),
      this.loadDataFromFile(fileB)
    ]);

    // Create indices for fast lookup
    const primaryKeys = this.getDefaultPrimaryKey(tableName);
    const indexA = this.createIndex(dataA, primaryKeys);
    const indexB = this.createIndex(dataB, primaryKeys);

    const onlyInA: Array<Record<string, any>> = [];
    const onlyInB: Array<Record<string, any>> = [];
    const different: RecordDifference[] = [];
    let identical = 0;

    // Find records only in A or different
    for (const [key, recordA] of indexA) {
      const recordB = indexB.get(key);
      
      if (!recordB) {
        onlyInA.push(recordA);
      } else {
        const diff = this.compareRecords(recordA, recordB);
        if (diff) {
          // Fix the primary key in the difference record
          diff.primaryKey = {};
          primaryKeys.forEach(pkField => {
            diff.primaryKey[pkField] = recordA[pkField];
          });
          different.push(diff);
        } else {
          identical++;
        }
        // Remove from indexB to track what's processed
        indexB.delete(key);
      }
    }

    // Remaining records in indexB are only in B
    for (const [, recordB] of indexB) {
      onlyInB.push(recordB);
    }

    const summary: TableComparison = {
      tableName,
      rowsInAOnly: onlyInA.length,
      rowsInBOnly: onlyInB.length,
      differentValues: different.length,
      identical,
      totalRowsA: dataA.length,
      totalRowsB: dataB.length,
      comparisonTimeMs: Date.now() - startTime
    };

    return {
      tableName,
      onlyInA,
      onlyInB,
      different,
      summary
    };
  }

  private async discoverTables(): Promise<string[]> {
    if (this.config.tables && this.config.tables.length > 0) {
      return this.config.tables;
    }

    // Auto-discover tables by finding common files in both directories
    const [filesA, filesB] = await Promise.all([
      fs.readdir(this.config.databaseA),
      fs.readdir(this.config.databaseB)
    ]);

    const tablesA = new Set(filesA.map(f => this.extractTableName(f)));
    const tablesB = new Set(filesB.map(f => this.extractTableName(f)));

    // Return tables that exist in both databases
    return Array.from(tablesA).filter(table => tablesB.has(table) && table !== '');
  }

  private extractTableName(filename: string): string {
    // Extract table name from filename like "alphaSepoliaSchema0.31.0_abi_changed.csv.gz" -> "abi_changed"
    const basename = path.basename(filename);
    
    // Remove file extensions (.csv.gz, .json.gz, etc.)
    let nameWithoutExt = basename;
    if (nameWithoutExt.endsWith('.gz')) {
      nameWithoutExt = nameWithoutExt.slice(0, -3);
    }
    if (nameWithoutExt.endsWith('.br')) {
      nameWithoutExt = nameWithoutExt.slice(0, -3);
    }
    if (nameWithoutExt.endsWith('.csv')) {
      nameWithoutExt = nameWithoutExt.slice(0, -4);
    }
    if (nameWithoutExt.endsWith('.json')) {
      nameWithoutExt = nameWithoutExt.slice(0, -5);
    }
    
    // Look for pattern like "schemaName_tableName" where schemaName can contain dots
    // We need to find where the schema ends and table begins
    // Pattern: alphaSepoliaSchema0.31.0_table_name
    
    // Try to match common schema patterns and extract everything after them
    const schemaPatterns = [
      /^[a-zA-Z]+Schema\d+\.\d+\.\d+_(.+)$/, // alphaSepoliaSchema0.31.0_tablename
      /^[a-zA-Z]+Schema\d+_(.+)$/,           // alphaSchema0_tablename  
      /^[a-zA-Z]+\d+\.\d+\.\d+_(.+)$/,      // alpha0.31.0_tablename
    ];
    
    for (const pattern of schemaPatterns) {
      const match = nameWithoutExt.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Fallback: take everything after the first underscore if it looks like schema_table
    const underscoreIndex = nameWithoutExt.indexOf('_');
    if (underscoreIndex > 0) {
      const possibleTableName = nameWithoutExt.substring(underscoreIndex + 1);
      // Make sure we got a valid table name (not empty, not just numbers/dots)
      if (possibleTableName && !/^[\d.]+$/.test(possibleTableName)) {
        return possibleTableName;
      }
    }
    
    // Final fallback to original name if extraction fails
    return nameWithoutExt;
  }

  private async findTableFile(directory: string, tableName: string): Promise<FileInfo> {
    const files = await fs.readdir(directory);
    
    // Look for files that contain the table name
    const matchingFiles = files.filter(filename => {
      const extractedName = this.extractTableName(filename);
      return extractedName === tableName;
    });

    if (matchingFiles.length === 0) {
      throw new Error(`No file found for table "${tableName}" in directory "${directory}"`);
    }

    if (matchingFiles.length > 1) {
      console.warn(`Multiple files found for table "${tableName}": ${matchingFiles.join(', ')}. Using first match.`);
    }

    const filePath = path.join(directory, matchingFiles[0]);
    return this.detectFileFormat(filePath);
  }

  private async loadDataFromFile(fileInfo: FileInfo): Promise<Array<Record<string, any>>> {
    const { path: filePath, format, compressionType } = fileInfo;

    // Check if file is actually compressed by examining magic bytes
    const isCompressed = await this.isFileActuallyCompressed(filePath, compressionType);

    let content: string;

    if (isCompressed && compressionType) {
      content = await this.readCompressedFile(filePath, compressionType);
    } else {
      content = await fs.readFile(filePath, 'utf8');
    }

    if (format === 'json') {
      return JSON.parse(content);
    } else {
      return this.parseCSV(content);
    }
  }

  private async isFileActuallyCompressed(filePath: string, compressionType?: 'gzip' | 'brotli'): Promise<boolean> {
    if (!compressionType) return false;

    try {
      // Read first few bytes to check magic number
      const buffer = Buffer.alloc(4);
      const fd = await fs.open(filePath, 'r');
      await fd.read(buffer, 0, 4, 0);
      await fd.close();

      if (compressionType === 'gzip') {
        // Gzip magic number: 0x1f, 0x8b
        return buffer[0] === 0x1f && buffer[1] === 0x8b;
      } else if (compressionType === 'brotli') {
        // Brotli magic number varies, this is a simple check
        return buffer[0] === 0xce || buffer[0] === 0xcf;
      }
    } catch (error) {
      console.warn(`Could not check compression for ${filePath}: ${error}`);
    }

    return false;
  }

  private async readCompressedFile(filePath: string, compressionType: 'gzip' | 'brotli'): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      const readStream = createReadStream(filePath);
      const decompressStream = compressionType === 'gzip' 
        ? createGunzip() 
        : createBrotliDecompress();

      decompressStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      decompressStream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      decompressStream.on('error', (error) => {
        reject(new Error(`Decompression failed: ${error.message}`));
      });

      readStream.on('error', (error) => {
        reject(new Error(`File read failed: ${error.message}`));
      });

      readStream.pipe(decompressStream);
    });
  }

  private parseCSV(content: string): Array<Record<string, any>> {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records: Array<Record<string, any>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const record: Record<string, any> = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    return records;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  private createIndex(data: Array<Record<string, any>>, primaryKeys: string[]): Map<string, Record<string, any>> {
    const index = new Map<string, Record<string, any>>();
    
    for (const record of data) {
      const key = this.createPrimaryKeyString(record, primaryKeys);
      index.set(key, record);
    }
    
    return index;
  }

  private async generateReport(report: ComparisonReport): Promise<void> {
    const outputPath = this.config.outputFile;
    
    switch (this.config.format) {
      case 'json':
        await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
        break;
      case 'csv':
        await this.generateCSVReport(report, outputPath);
        break;
      case 'html':
        await this.generateHTMLReport(report, outputPath);
        break;
    }
    
    console.log(`Comparison report saved to: ${outputPath}`);
  }

  private async generateCSVReport(report: ComparisonReport, outputPath: string): Promise<void> {
    const lines: string[] = [];
    
    // Header
    lines.push('Table,Total A,Total B,Identical,Different,Only A,Only B,Time (ms)');
    
    // Data rows
    for (const tc of report.tableComparisons) {
      lines.push([
        tc.tableName,
        tc.totalRowsA,
        tc.totalRowsB,
        tc.identical,
        tc.differentValues,
        tc.rowsInAOnly,
        tc.rowsInBOnly,
        tc.comparisonTimeMs
      ].join(','));
    }
    
    await fs.writeFile(outputPath, lines.join('\n'));
  }

  private async generateHTMLReport(report: ComparisonReport, outputPath: string): Promise<void> {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Database Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .different { background-color: #ffe6e6; }
        .only-a { background-color: #e6f3ff; }
        .only-b { background-color: #fff0e6; }
        .identical { background-color: #e6ffe6; }
    </style>
</head>
<body>
    <h1>Database Comparison Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Database A:</strong> ${report.databaseA}</p>
        <p><strong>Database B:</strong> ${report.databaseB}</p>
        <p><strong>Compared:</strong> ${report.summary.tablesCompared} tables</p>
        <p><strong>Total Differences:</strong> ${report.summary.totalDifferences}</p>
        <p><strong>Comparison Time:</strong> ${report.summary.comparisonTimeMs}ms</p>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
    </div>

    <h2>Table Comparison Results</h2>
    <table>
        <thead>
            <tr>
                <th>Table</th>
                <th>Total A</th>
                <th>Total B</th>
                <th class="identical">Identical</th>
                <th class="different">Different</th>
                <th class="only-a">Only in A</th>
                <th class="only-b">Only in B</th>
                <th>Time (ms)</th>
            </tr>
        </thead>
        <tbody>
${report.tableComparisons.map(tc => `
            <tr>
                <td>${tc.tableName}</td>
                <td>${tc.totalRowsA}</td>
                <td>${tc.totalRowsB}</td>
                <td class="identical">${tc.identical}</td>
                <td class="different">${tc.differentValues}</td>
                <td class="only-a">${tc.rowsInAOnly}</td>
                <td class="only-b">${tc.rowsInBOnly}</td>
                <td>${tc.comparisonTimeMs}</td>
            </tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;

    await fs.writeFile(outputPath, html);
  }
} 
