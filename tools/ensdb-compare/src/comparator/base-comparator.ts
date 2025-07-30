/**
 * Base comparator interfaces and types for database comparison
 */

export interface ComparisonConfig {
  databaseA: string;        // Path to database A exports
  databaseB: string;        // Path to database B exports
  outputFile: string;       // Path for comparison report
  format: 'json' | 'csv' | 'html';  // Report format
  tables?: string[];        // Specific tables to compare (default: all)
  primaryKeys?: Record<string, string[]>; // Custom primary keys per table
}

export interface TableComparison {
  tableName: string;
  rowsInAOnly: number;
  rowsInBOnly: number;
  differentValues: number;
  identical: number;
  totalRowsA: number;
  totalRowsB: number;
  comparisonTimeMs: number;
}

export interface RecordDifference {
  primaryKey: Record<string, any>;
  fieldsDifferent: string[];
  valuesA: Record<string, any>;
  valuesB: Record<string, any>;
}

export interface TableDifferences {
  tableName: string;
  onlyInA: Array<Record<string, any>>;
  onlyInB: Array<Record<string, any>>;
  different: RecordDifference[];
  summary: TableComparison;
}

export interface ComparisonReport {
  timestamp: string;
  databaseA: string;
  databaseB: string;
  summary: {
    tablesCompared: number;
    totalDifferences: number;
    comparisonTimeMs: number;
  };
  tableComparisons: TableComparison[];
  details: TableDifferences[];
}

export interface FileInfo {
  path: string;
  format: 'csv' | 'json';
  compressed: boolean;
  compressionType?: 'gzip' | 'brotli';
}

export abstract class BaseComparator {
  protected config: ComparisonConfig;

  constructor(config: ComparisonConfig) {
    this.config = config;
  }

  abstract compareDatabase(): Promise<ComparisonReport>;
  abstract compareTable(tableName: string, fileA: FileInfo, fileB: FileInfo): Promise<TableDifferences>;
  
  // Utility methods
  protected detectFileFormat(filePath: string): FileInfo {
    const path = filePath.toLowerCase();
    let format: 'csv' | 'json' = 'csv';
    let compressed = false;
    let compressionType: 'gzip' | 'brotli' | undefined;

    // Determine format from filename
    if (path.includes('.json')) format = 'json';
    if (path.includes('.csv')) format = 'csv';
    
    // Check extensions for potential compression, but we'll verify later
    if (path.endsWith('.gz')) {
      compressionType = 'gzip';
    } else if (path.endsWith('.br')) {
      compressionType = 'brotli';
    }

    return {
      path: filePath,
      format,
      compressed, // Will be set to false initially, actual detection happens in loadDataFromFile
      compressionType
    };
  }

  protected getDefaultPrimaryKey(tableName: string): string[] {
    // Default primary keys for known ENS tables
    const defaultKeys: Record<string, string[]> = {
      domains: ['id'],
      accounts: ['id'],
      resolvers: ['id'],
      registrations: ['id'],
      resolver_address_records: ['id'],
      resolver_text_records: ['id'],
      ext_resolver_address_records: ['id'],
      ext_resolver_text_records: ['id'],
      ext_registration_referral: ['id']
    };

    return this.config.primaryKeys?.[tableName] || defaultKeys[tableName] || ['id'];
  }

  protected createPrimaryKeyString(record: Record<string, any>, primaryKeys: string[]): string {
    return primaryKeys.map(key => String(record[key] || '')).join('|');
  }

  protected compareRecords(recordA: Record<string, any>, recordB: Record<string, any>): RecordDifference | null {
    const fieldsDifferent: string[] = [];
    const valuesA: Record<string, any> = {};
    const valuesB: Record<string, any> = {};

    // Compare all fields from both records
    const allFields = new Set([...Object.keys(recordA), ...Object.keys(recordB)]);

    for (const field of allFields) {
      const valueA = recordA[field];
      const valueB = recordB[field];

      // Deep comparison for different types
      if (!this.valuesEqual(valueA, valueB)) {
        fieldsDifferent.push(field);
        valuesA[field] = valueA;
        valuesB[field] = valueB;
      }
    }

    if (fieldsDifferent.length === 0) {
      return null; // Records are identical
    }

    const primaryKeys = this.getDefaultPrimaryKey('unknown'); // Will be overridden by actual implementation
    const primaryKey: Record<string, any> = {};
    primaryKeys.forEach(key => {
      primaryKey[key] = recordA[key] || recordB[key];
    });

    return {
      primaryKey,
      fieldsDifferent,
      valuesA,
      valuesB
    };
  }

  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    // Handle arrays and objects
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.valuesEqual(item, b[index]));
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => keysB.includes(key) && this.valuesEqual(a[key], b[key]));
    }
    
    // Convert to strings for comparison (handles numbers, booleans, etc.)
    return String(a) === String(b);
  }
} 
