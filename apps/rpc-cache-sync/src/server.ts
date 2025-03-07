import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { parse as parseConnectionString } from "pg-connection-string";
import { Pool } from "pg";

// For ES Module support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface JobOptions {
  cleanFirst?: boolean;
  parallelJobs?: string;
}

interface Job {
  id: string;
  status: "initializing" | "running" | "completed" | "failed";
  progress: number;
  currentPhase: "preparation" | "schema_migration" | "data_migration" | "completion";
  log: string[];
  startTime: string;
  endTime: string | null;
  schema?: string;
}

// Store job status
const jobs: Record<string, Job> = {};

// Helper to parse connection string and extract schema name
function parseConnection(connectionString: string) {
  const config = parseConnectionString(connectionString);
  // Extract schema from searchPath if present
  let schema = "public";
  if (config.options) {
    const options = config.options.split(" ");
    for (const option of options) {
      if (option.startsWith("search_path=")) {
        schema = option.split("=")[1].split(",")[0].trim();
        break;
      }
    }
  }
  return { config, schema };
}

// Function to validate connection
async function validateConnection(
  connectionString: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pool = new Pool({ connectionString });
    await pool.query("SELECT 1"); // Test connection
    await pool.end();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function getSchemaSize(connectionString: string, schemaName: string): Promise<number> {
  try {
    const pool = new Pool({ connectionString });
    const result = await pool.query(`
      SELECT sum(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))::bigint) as size
      FROM pg_tables
      WHERE schemaname = $1
    `, [schemaName]);
    await pool.end();
    return parseInt(result.rows[0].size || '0');
  } catch (error) {
    console.error('Error getting schema size:', error);
    return 0;
  }
}

// Function to start migration process
async function startMigrationProcess(
  jobId: string,
  sourceConnection: string,
  targetConnection: string,
  schemaName: string | null,
  options: JobOptions
) {
  try {
    // Validate connections
    const sourceValid = await validateConnection(sourceConnection);
    const targetValid = await validateConnection(targetConnection);

    if (!sourceValid.success) {
      jobs[jobId].status = "failed";
      addLogWithTimestamp(jobId, `Error with source connection: ${sourceValid.error}`);
      jobs[jobId].endTime = new Date().toISOString();
      return;
    }

    if (!targetValid.success) {
      jobs[jobId].status = "failed";
      addLogWithTimestamp(jobId, `Error with target connection: ${targetValid.error}`);
      jobs[jobId].endTime = new Date().toISOString();
      return;
    }

    // Parse connection strings
    const source = parseConnection(sourceConnection);
    const target = parseConnection(targetConnection);

    // Use provided schema name or extract from source connection
    const schema = schemaName || source.schema;

    // Get schema size
    const sourceSize = await getSchemaSize(sourceConnection, schema);
    addLogWithTimestamp(jobId, `Source schema '${schema}' size: ${formatBytes(sourceSize)}`);


    // Update job status
    jobs[jobId].schema = schema;
    jobs[jobId].status = "running";
    addLogWithTimestamp(jobId, `Connections validated. Starting schema migration for schema '${schema}'...`);

    // PHASE 1: Schema-only migration
    jobs[jobId].currentPhase = "schema_migration";
    addLogWithTimestamp(jobId, "PHASE 1: Migrating schema structure (no data)...");

    // Set up dump command for schema only
    const schemaDumpCmd = [
      "pg_dump",
      "--schema-only",
      "--format=custom",
      `-n ${schema}`,
      sourceConnection
    ];

    // Set up restore command
    // In the schemaRestoreCmd array (around line 107):
    const schemaRestoreCmd = [
      "pg_restore",
      "--no-owner",
      "--no-privileges",
      "-d",
      targetConnection
    ];

    if (options?.cleanFirst) {
      schemaRestoreCmd.splice(1, 0, "--clean");
    }

    // Log commands (sanitized)
    const sanitizedSchemaDump = schemaDumpCmd.map(part =>
      part.includes("postgres://") ? "postgres://[CREDENTIALS_HIDDEN]" : part
    ).join(" ");

    const sanitizedSchemaRestore = schemaRestoreCmd.map(part =>
      part.includes("postgres://") ? "postgres://[CREDENTIALS_HIDDEN]" : part
    ).join(" ");

    addLogWithTimestamp(jobId, `Executing: ${sanitizedSchemaDump} | ${sanitizedSchemaRestore}`);

    // Execute schema migration
    const schemaDumpProcess = spawn("pg_dump", schemaDumpCmd.slice(1), {
      env: { ...process.env, PGOPTIONS: "-c search_path=" + schema },
      shell: true
    });

    const schemaRestoreProcess = spawn("pg_restore", schemaRestoreCmd.slice(1), {
      env: { ...process.env },
      shell: true,
      stdio: ["pipe", "pipe", "pipe"]
    });

    // Connect processes
    schemaDumpProcess.stdout.pipe(schemaRestoreProcess.stdin);

    // Collect output
    schemaDumpProcess.stderr.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        addLogWithTimestamp(jobId, `[Schema Dump] ${message}`);
      }
    });

    schemaRestoreProcess.stderr.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      if (message) {
        addLogWithTimestamp(jobId, `[Schema Restore] ${message}`);
      }
    });

    // Handle schema migration completion
    schemaRestoreProcess.on("close", (code: number | null) => {
      if (code !== 0) {
        jobs[jobId].status = "failed";
        addLogWithTimestamp(jobId, `Schema migration failed with exit code ${code}`);
        jobs[jobId].endTime = new Date().toISOString();
        return;
      }

      addLogWithTimestamp(jobId, "Schema migration completed successfully");

      // PHASE 2: Data-only migration
      startDataMigration();
    });

    // Function to start data migration after schema is done
    function startDataMigration() {
      jobs[jobId].currentPhase = "data_migration";
      addLogWithTimestamp(jobId, "PHASE 2: Migrating data...");

      // Set up dump command for data only
      const dataDumpCmd = [
        "pg_dump",
        "--data-only",
        "--format=custom",
        `-n ${schema}`,
        sourceConnection
      ];

      // Set up restore command for data
      const dataRestoreCmd = [
        "pg_restore",
        "--no-owner",
        "--disable-triggers",
        "-d",
        targetConnection
      ];

      // if (options?.parallelJobs && parseInt(options.parallelJobs) > 1) {
      //   dataRestoreCmd.splice(1, 0, `-j ${options.parallelJobs}`);
      // }

      // Log commands (sanitized)
      const sanitizedDataDump = dataDumpCmd.map(part =>
        part.includes("postgres://") ? "postgres://[CREDENTIALS_HIDDEN]" : part
      ).join(" ");

      const sanitizedDataRestore = dataRestoreCmd.map(part =>
        part.includes("postgres://") ? "postgres://[CREDENTIALS_HIDDEN]" : part
      ).join(" ");

      addLogWithTimestamp(jobId, `Executing: ${sanitizedDataDump} | ${sanitizedDataRestore}`);

      // Execute data migration
      const dataDumpProcess = spawn("pg_dump", dataDumpCmd.slice(1), {
        env: { ...process.env, PGOPTIONS: "-c search_path=" + schema },
        shell: true
      });

      const dataRestoreProcess = spawn("pg_restore", dataRestoreCmd.slice(1), {
        env: { ...process.env },
        shell: true,
        stdio: ["pipe", "pipe", "pipe"]
      });

      // Connect processes
      dataDumpProcess.stdout.pipe(dataRestoreProcess.stdin);

      // Collect output
      dataDumpProcess.stderr.on("data", (data: Buffer) => {
        const message = data.toString().trim();
        if (message) {
          addLogWithTimestamp(jobId, `[Data Dump] ${message}`);
        }
      });

      dataRestoreProcess.stderr.on("data", (data: Buffer) => {
        const message = data.toString().trim();
        if (message) {
          addLogWithTimestamp(jobId, `[Data Restore] ${message}`);
          // Calculate approximate progress
          jobs[jobId].progress = 50 + Math.min(
            49,
            (jobs[jobId].log.filter(l => l.includes("[Data Restore]")).length / 100) * 50
          );
        }
      });

      // Handle data migration completion
      dataRestoreProcess.on("close", (code: number | null) => {
        if (code !== 0) {
          jobs[jobId].status = "failed";
          addLogWithTimestamp(jobId, `Data migration failed with exit code ${code}`);
        } else {
          jobs[jobId].status = "completed";
          jobs[jobId].progress = 100;
          jobs[jobId].currentPhase = "completion";
          addLogWithTimestamp(jobId, "Data migration completed successfully");
          addLogWithTimestamp(jobId, "MIGRATION COMPLETE");
        }

        jobs[jobId].endTime = new Date().toISOString();
      });

      // Set up progress tracking interval
      const progressInterval = setInterval(async () => {
        if (jobs[jobId].status !== "running") {
          clearInterval(progressInterval);
          return;
        }

        const targetSize = await getSchemaSize(targetConnection, schema);

        // Simple direct percentage calculation
        if (sourceSize > 0) {
          // Calculate raw percentage of data transferred
          const progressPercentage = (targetSize / sourceSize) * 100;

          jobs[jobId].progress = progressPercentage;
          addLogWithTimestamp(jobId, `Progress update: ${progressPercentage.toFixed(2)}% - ${formatBytes(targetSize)} of ${formatBytes(sourceSize)}`);
        }
      }, 5000); // Check every 5 seconds

      // Clear interval when process ends
      const originalDataRestoreProcessOnClose = dataRestoreProcess.on.bind(dataRestoreProcess);
      dataRestoreProcess.on = function (event, listener) {
        if (event === 'close') {
          return originalDataRestoreProcessOnClose(event, (...args) => {
            clearInterval(progressInterval);
            listener(...args); // Forward all arguments to the original listener
          });
        }
        return originalDataRestoreProcessOnClose(event, listener);
      };
    }
  } catch (error) {
    jobs[jobId].status = "failed";
    addLogWithTimestamp(jobId, `Error: ${(error as Error).message}`);
    jobs[jobId].endTime = new Date().toISOString();
  }
}

// Helper function to add timestamped logs
function addLogWithTimestamp(jobId: string, message: string) {
  jobs[jobId].log.push(`[${new Date().toISOString()}] ${message}`);
}

// Helper function to format bytes nicely
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Create Bun server using modern routes API
Bun.serve({
  port: process.env.PORT || 3000,

  routes: {
    // API endpoint to validate connection
    "/api/validate-connection": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const result = await validateConnection(body.connectionString);
          return Response.json(result);
        } catch (error) {
          return Response.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
          );
        }
      }
    },

    // API endpoint to start a migration
    "/api/transfer": {
      POST: async (req) => {
        const body = await req.json();
        const { sourceConnection, targetConnection, schemaName, options } = body;

        // Generate job ID
        const jobId = uuidv4();

        // Initialize job status
        jobs[jobId] = {
          id: jobId,
          status: "initializing",
          progress: 0,
          currentPhase: "preparation",
          log: ["Job created, validating connections..."],
          startTime: new Date().toISOString(),
          endTime: null,
        };

        // Start migration process in background
        startMigrationProcess(jobId, sourceConnection, targetConnection, schemaName, options);

        // Respond with job ID
        return Response.json({ jobId });
      }
    },

    // API endpoint to get job status
    "/api/job/:jobId": {
      GET: (req) => {
        const jobId = req.params.jobId;

        if (jobs[jobId]) {
          return Response.json(jobs[jobId]);
        } else {
          return Response.json({ error: "Job not found" }, { status: 404 });
        }
      }
    },

    // Serve index.html for root path
    "/": async () => {
      const file = Bun.file(path.join(__dirname, "../public/index.html"));
      return new Response(file, {
        headers: { "Content-Type": "text/html" }
      });
    },

    // Serve static files from public directory
    "/styles/*": async (req) => {
      const filePath = path.join(__dirname, "../public", new URL(req.url).pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        const contentType = filePath.endsWith(".css") ? "text/css" : "text/plain";
        return new Response(file, {
          headers: { "Content-Type": contentType }
        });
      } else {
        return new Response("Not found", { status: 404 });
      }
    },

    // Fallback for any other routes (wildcard must start with '/')
    "/*": async (req) => {
      // Try to serve as static file
      const filePath = path.join(__dirname, "../public", new URL(req.url).pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) {
        return new Response(file);
      } else {
        return new Response("Not found", { status: 404 });
      }
    }
  }
});

console.log(`Server running on port ${process.env.PORT || 3000}`);
