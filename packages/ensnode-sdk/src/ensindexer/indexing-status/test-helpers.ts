import { SerializedBlockRef, deserializeBlockRef } from "../../shared";

export const earliestSerializedBlockRef = {
  createdAt: "2022-10-31T23:59:59.999Z",
  number: 999,
} satisfies SerializedBlockRef;

export const earliestBlockRef = deserializeBlockRef(earliestSerializedBlockRef);

export const earlierSerializedBlockRef = {
  createdAt: "2022-12-31T23:59:59.999Z",
  number: 1024,
} satisfies SerializedBlockRef;

export const earlierBlockRef = deserializeBlockRef(earlierSerializedBlockRef);

export const laterSerializedBlockRef = {
  createdAt: "2023-01-01T00:00:00.000Z",
  number: 1025,
} satisfies SerializedBlockRef;

export const laterBlockRef = deserializeBlockRef(laterSerializedBlockRef);

export const latestSerializedBlockRef = {
  createdAt: "2023-02-22T22:22:22.222Z",
  number: 1222,
} satisfies SerializedBlockRef;

export const latestBlockRef = deserializeBlockRef(latestSerializedBlockRef);
