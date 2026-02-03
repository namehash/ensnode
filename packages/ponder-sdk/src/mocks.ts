import type { PonderStatusResponse } from "./ponder-status";

export const validPonderStatusResponse = {
  "1": {
    id: 1,
    block: {
      number: 24375715,
      timestamp: 1770114251,
    },
  },
  "10": {
    id: 10,
    block: {
      number: 147257736,
      timestamp: 1770114249,
    },
  },
  "8453": {
    id: 8453,
    block: {
      number: 41662451,
      timestamp: 1770114249,
    },
  },
  "42161": {
    id: 42161,
    block: {
      number: 428158835,
      timestamp: 1770114250,
    },
  },
  "59144": {
    id: 59144,
    block: {
      number: 28577755,
      timestamp: 1770114244,
    },
  },
  "534352": {
    id: 534352,
    block: {
      number: 29352537,
      timestamp: 1770114250,
    },
  },
} satisfies PonderStatusResponse;

export const validPonderStatusResponseMinimal = {
  "1": {
    id: 1,
    block: {
      number: 4375715,
      timestamp: 1770114251,
    },
  },
};

export const invalidPonderStatusResponseNegativeBlockNumber = {
  "1": {
    id: 1,
    block: {
      number: -24375715, // Invalid negative block number
      timestamp: 1770114251,
    },
  },
};
