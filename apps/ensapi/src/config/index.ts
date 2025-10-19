// TODO: ENSAPIConfig
interface ENSAPIConfig {
  databaseUrl: string;
  databaseSchema: string;
  ensindexerUrl: string;
}

export default {
  databaseUrl: process.env.DATABASE_URL!,
  databaseSchema: process.env.DATABASE_SCHEMA!,
  ensindexerUrl: process.env.ENSINDEXER_URL!,
} satisfies ENSAPIConfig;
