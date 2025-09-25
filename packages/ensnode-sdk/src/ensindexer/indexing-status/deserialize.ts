import { prettifyError } from "zod/v4";
import type {
  SerializedCurrentIndexingProjection,
  SerializedOmnichainIndexingSnapshot,
} from "./serialized-types";
import type { CurrentIndexingProjection, OmnichainIndexingSnapshot } from "./types";
import {
  makeCurrentIndexingProjectionSchema,
  makeOmnichainIndexingSnapshotSchema,
} from "./zod-schemas";

/**
 * Serialize a {@link OmnichainIndexingSnapshot} object.
 */
export function deserializeOmnichainIndexingSnapshot(
  maybeStatus: SerializedOmnichainIndexingSnapshot,
  valueLabel?: string,
): OmnichainIndexingSnapshot {
  const schema = makeOmnichainIndexingSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeStatus);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize OmnichainIndexingSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Serialize a {@link CurrentIndexingProjection} object.
 */
export function deserializeCurrentIndexingProjection(
  maybeProjection: SerializedCurrentIndexingProjection,
  valueLabel?: string,
): CurrentIndexingProjection {
  const schema = makeCurrentIndexingProjectionSchema(valueLabel);
  const parsed = schema.safeParse(maybeProjection);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize CurrentIndexingProjection:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
