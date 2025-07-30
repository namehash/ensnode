/**
 * Base exporter interface for database export functionality
 */

export interface ExportConfig {
  connectionString: string;
  outputDir: string;
  format: 'binary' | 'csv' | 'json' | 'parquet';
  compression?: 'gzip' | 'brotli' | 'none';
  chunkSize?: number;
}

export interface ExportResult {
  filePath: string;
  stats: ExportStats;
}

export interface ExportStats {
  exportTimeMs: number;
  rowCount: number;
  fileSizeBytes: number;
}

export interface BenchmarkResult {
  success: boolean;
  stats: ExportStats;
  error?: string;
}

export interface BenchmarkSummary {
  results: BenchmarkResult[];
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
}

export abstract class BaseExporter {
  protected config: ExportConfig;

  constructor(config: ExportConfig) {
    this.config = config;
  }

  abstract exportTable(schema: string, table: string): Promise<ExportResult>;
  abstract testConnection(): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract getActualTables(schema: string): Promise<string[]>;

  async benchmarkExport(schema: string, table: string, iterations: number = 3): Promise<BenchmarkSummary> {
    const results: BenchmarkResult[] = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const result = await this.exportTable(schema, table);
        results.push({
          success: true,
          stats: result.stats
        });
      } catch (error) {
        results.push({
          success: false,
          stats: { exportTimeMs: 0, rowCount: 0, fileSizeBytes: 0 },
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    const successfulResults = results.filter(r => r.success);
    const times = successfulResults.map(r => r.stats.exportTimeMs);

    return {
      results,
      avgTimeMs: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      minTimeMs: times.length > 0 ? Math.min(...times) : 0,
      maxTimeMs: times.length > 0 ? Math.max(...times) : 0,
    };
  }
}

// File format utilities
export function getFileExtension(format: string, compression?: string): string {
  let ext = '';
  switch (format) {
    case 'binary': ext = '.bin'; break;
    case 'csv': ext = '.csv'; break;  
    case 'json': ext = '.json'; break;
    case 'parquet': ext = '.parquet'; break;
    default: ext = '.bin';
  }
  
  if (compression === 'gzip') ext += '.gz';
  if (compression === 'brotli') ext += '.br';
  
  return ext;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
