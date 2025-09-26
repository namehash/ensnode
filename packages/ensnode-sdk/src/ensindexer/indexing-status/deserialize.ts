import { prettifyError } from "zod/v4";
import type {
  SerializedChainIndexingSnapshot,
  SerializedCurrentIndexingProjection,
  SerializedOmnichainIndexingSnapshot,
} from "./serialized-types";
import type {
  ChainIndexingSnapshot,
  CurrentIndexingProjection,
  OmnichainIndexingSnapshot,
} from "./types";
import {
  makeChainIndexingSnapshotSchema,
  makeCurrentIndexingProjectionSchema,
  makeOmnichainIndexingSnapshotSchema,
} from "./zod-schemas";

/**
 * Deserialize into a {@link ChainIndexingSnapshot} object.
 */
export function deserializeChainIndexingSnapshot(
  maybeSnapshot: SerializedChainIndexingSnapshot,
  valueLabel?: string,
): ChainIndexingSnapshot {
  const schema = makeChainIndexingSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into ChainIndexingSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize an {@link OmnichainIndexingSnapshot} object.
 */
export function deserializeOmnichainIndexingSnapshot(
  maybeSnapshot: SerializedOmnichainIndexingSnapshot,
  valueLabel?: string,
): OmnichainIndexingSnapshot {
  const schema = makeOmnichainIndexingSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into OmnichainIndexingSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize into a {@link CurrentIndexingProjection} object.
 */
export function deserializeCurrentIndexingProjection(
  maybeProjection: SerializedCurrentIndexingProjection,
  valueLabel?: string,
): CurrentIndexingProjection {
  const schema = makeCurrentIndexingProjectionSchema(valueLabel);
  const parsed = schema.safeParse(maybeProjection);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into CurrentIndexingProjection:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
