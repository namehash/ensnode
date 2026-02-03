import type { SerializedPonderIndexingStatus } from "./deserialize/indexing-status";

export const mockSerializedPonderIndexingStatusValid = {
  mainnet: {
    id: 1,
    block: {
      number: 24375715,
      timestamp: 1770114251,
    },
  },
  optimism: {
    id: 10,
    block: {
      number: 147257736,
      timestamp: 1770114249,
    },
  },
  base: {
    id: 8453,
    block: {
      number: 41662451,
      timestamp: 1770114249,
    },
  },
  arbitrum: {
    id: 42161,
    block: {
      number: 428158835,
      timestamp: 1770114250,
    },
  },
  linea: {
    id: 59144,
    block: {
      number: 28577755,
      timestamp: 1770114244,
    },
  },
  scroll: {
    id: 534352,
    block: {
      number: 29352537,
      timestamp: 1770114250,
    },
  },
} satisfies SerializedPonderIndexingStatus;

export const mockSerializedPonderIndexingStatusInvalidBlockNumber = {
  mainnet: {
    id: 1,
    block: {
      number: -24375715, // Invalid negative block number
      timestamp: 1770114251,
    },
  },
} satisfies SerializedPonderIndexingStatus;

export const mockSerializedPonderIndexingStatusInvalidChainId = {
  mainnet: {
    id: 0, // Invalid non-positive chain ID
    block: {
      number: 24375715,
      timestamp: 1770114251,
    },
  },
} satisfies SerializedPonderIndexingStatus;
