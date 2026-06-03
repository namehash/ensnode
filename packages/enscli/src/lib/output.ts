import { toJson } from "@ensnode/ensnode-sdk";

/**
 * Resolves the output format: explicit `--output` wins, otherwise `json` when stdout is piped (the
 * agent case) and `pretty` in an interactive TTY.
 */
export function resolveFormat(args: Record<string, unknown>): "json" | "pretty" {
  const explicit = args.output;
  if (explicit === "json" || explicit === "pretty") return explicit;
  if (explicit !== undefined) {
    throw new Error(`Invalid --output "${String(explicit)}". Expected "json" or "pretty".`);
  }
  return process.stdout.isTTY ? "pretty" : "json";
}

/**
 * Prints a command result. In `pretty` mode, `prettyText` (when provided) renders a human-friendly
 * form; otherwise the full structured payload is printed as indented JSON.
 */
export function printResult<T>(
  data: T,
  args: Record<string, unknown>,
  prettyText?: (data: T) => string,
): void {
  if (resolveFormat(args) === "pretty" && prettyText) {
    process.stdout.write(`${prettyText(data)}\n`);
  } else {
    process.stdout.write(`${toJson(data, { pretty: true })}\n`);
  }
}

/** Streams rows as NDJSON (one JSON object per line) for paginated/list output. */
export function printNdjson(rows: unknown[]): void {
  for (const row of rows) {
    process.stdout.write(`${toJson(row)}\n`);
  }
}

/** Writes a structured error to stderr and exits non-zero. */
export function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${toJson({ error: { message } }, { pretty: true })}\n`);
  process.exit(1);
}

/** Runs a command body, routing any thrown error through {@link fail}. */
export async function runSafely(fn: () => unknown | Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    fail(error);
  }
}
