import { prettifyError } from "zod/v4";
import type { ChainIdString, UrlString } from "./serialized-types";
import type { BlockNumber, BlockRef, ChainId, Datetime } from "./types";
import {
  makeBlockNumberSchema,
  makeBlockRefSchema,
  makeChainIdStringSchema,
  makeDatetimeSchema,
  makeUnixTimestampSchema,
  makeUrlSchema,
} from "./zod-schemas";

export function deserializeChainId(maybeChainId: ChainIdString, valueLabel?: string): ChainId {
  const schema = makeChainIdStringSchema(valueLabel);
  const parsed = schema.safeParse(maybeChainId);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ChainId:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeDatetime(maybeDatetime: string, valueLabel?: string): Datetime {
  const schema = makeDatetimeSchema(valueLabel);
  const parsed = schema.safeParse(maybeDatetime);

  if (parsed.error) {
    throw new Error(`Cannot deserialize Datetime:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeUnixTimestamp(maybeTimestamp: number, valueLabel?: string) {
  const schema = makeUnixTimestampSchema(valueLabel);
  const parsed = schema.safeParse(maybeTimestamp);

  if (parsed.error) {
    throw new Error(`Cannot deserialize Unix Timestamp:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeUrl(maybeUrl: UrlString, valueLabel?: string): URL {
  const schema = makeUrlSchema(valueLabel);
  const parsed = schema.safeParse(maybeUrl);

  if (parsed.error) {
    throw new Error(`Cannot deserialize URL:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeBlockNumber(maybeBlockNumber: number, valueLabel?: string): BlockNumber {
  const schema = makeBlockNumberSchema(valueLabel);
  const parsed = schema.safeParse(maybeBlockNumber);

  if (parsed.error) {
    throw new Error(`Cannot deserialize BlockNumber:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeBlockRef(maybeBlockRef: unknown, valueLabel?: string): BlockRef {
  const schema = makeBlockRefSchema(valueLabel);
  const parsed = schema.safeParse(maybeBlockRef);

  if (parsed.error) {
    throw new Error(`Cannot deserialize BlockRef:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
