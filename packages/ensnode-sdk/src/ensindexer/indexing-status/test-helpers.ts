import { BlockRef } from "../../shared";

export const earliestBlockRef = {
  timestamp: 1667260799,
  number: 999,
} as const satisfies BlockRef;

export const earlierBlockRef = {
  timestamp: 1672531199,
  number: 1024,
} as const satisfies BlockRef;

export const laterBlockRef = {
  timestamp: 1672531200,
  number: 1025,
} as const satisfies BlockRef;

export const latestBlockRef = {
  timestamp: 1677104542,
  number: 1222,
} as const satisfies BlockRef;
