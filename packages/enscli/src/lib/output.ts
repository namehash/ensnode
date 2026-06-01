/** JSON replacer that renders bigints as strings so results never crash serialization. */
function replacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function stringify(data: unknown): string {
  return JSON.stringify(data, replacer, 2);
}

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
export function printResult(
  data: unknown,
  args: Record<string, unknown>,
  prettyText?: (data: never) => string,
): void {
  if (resolveFormat(args) === "pretty" && prettyText) {
    process.stdout.write(`${prettyText(data as never)}\n`);
  } else {
    process.stdout.write(`${stringify(data)}\n`);
  }
}

/** Streams rows as NDJSON (one JSON object per line) for paginated/list output. */
export function printNdjson(rows: unknown[]): void {
  for (const row of rows) {
    process.stdout.write(`${JSON.stringify(row, replacer)}\n`);
  }
}

/** Writes a structured error to stderr and exits non-zero. */
export function fail(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${stringify({ error: { message } })}\n`);
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
