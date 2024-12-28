import convict from "convict";
import { loadEnvVars } from "./env-vars";

interface PostgresConnectionConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  dbName: string;
  socketPath?: string;
}

const configSchema = convict<PostgresConnectionConfig>({
  user: {
    doc: "The user to authenticate as.",
    format: String,
    default: "",
    env: "POSTGRES_USER",
  },
  password: {
    doc: "The password to authenticate with.",
    format: String,
    default: "",
    env: "POSTGRES_PASSWORD",
  },
  host: {
    doc: "The host to connect to.",
    format: String,
    default: "",
    env: "POSTGRES_HOST",
  },
  port: {
    doc: "The port to connect to.",
    format: "port",
    default: 5432,
    env: "POSTGRES_PORT",
  },
  dbName: {
    doc: "The name of the database to connect to.",
    format: String,
    default: "",
    env: "POSTGRES_DB",
  },
  socketPath: {
    doc: "The path to the Unix domain socket.",
    format: String,
    default: "",
    env: "POSTGRES_UNIX_SOCKET_PATH",
  },
});

export const config = loadEnvVars(configSchema);

export class PostgresConnectionString {
  constructor(
    private readonly user: string,
    private readonly password: string,
    private readonly host: string,
    private readonly port: number,
    private readonly dbName: string,
    private readonly socketPath?: string,
  ) {}

  static safeFromEnv(): PostgresConnectionString | null {
    try {
      return PostgresConnectionString.fromEnv();
    } catch (error) {
      console.error(`Failed to parse Postgres connection string from environment: ${error}`);
      return null;
    }
  }

  static fromEnv(): PostgresConnectionString {
    if (!config.user || !config.password || !config.host || !config.port || !config.dbName) {
      throw new Error("Missing required environment variables for Postgres connection");
    }

    return new PostgresConnectionString(
      config.user,
      config.password,
      config.host,
      config.port,
      config.dbName,
      config.socketPath,
    );
  }

  toRawString(): string {
    let connectionString = `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.dbName}`;

    if (this.socketPath) {
      connectionString += `?host=${this.socketPath}`;
    }

    return connectionString;
  }

  toString(): string {
    const maskedPassword = "*".repeat(8);
    let connectionString = `postgresql://${this.user}:${maskedPassword}@${this.host}:${this.port}/${this.dbName}`;

    if (this.socketPath) {
      connectionString += `?host=${this.socketPath}`;
    }

    return connectionString;
  }
}
