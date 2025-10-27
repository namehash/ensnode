import pino, { type Level, levels } from "pino";
import { prettifyError, z } from "zod/v4";

const makePino = (level: Level) =>
  pino({
    level,
    transport:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: {
              colorize: true,
              ignore: "pid,hostname",
            },
          },
  });

const LogLevelSchema = z
  .enum(levels.labels, {
    error: `Invalid LOG_LEVEL, expected one of '${Object.values(levels.labels).join("' | '")}'`,
  })
  .transform((level) => level as Level)
  .default("debug");

const level = LogLevelSchema.safeParse(process.env.LOG_LEVEL);

if (!level.success) {
  makePino("fatal").fatal(prettifyError(level.error));
  process.exit(1);
}

export default makePino(level.data);
