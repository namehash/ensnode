import {
  Duration,
  InterpretedName,
  NamedRegistrarAction,
  OmnichainIndexingStatusIds,
  PluginName,
} from "@ensnode/ensnode-sdk";

import {
  RegistrarActionsAvailable,
  RegistrarActionsIndexingStatusNotReady,
  RegistrarActionsInitial,
  RegistrarActionsUnavailable,
  RegistrarActionsUnresolved,
  RegistrarActionsUnsupportedConfig,
  ResolutionStatusId,
  ResolutionStatusIds,
  ResolvedRegistrarActions,
} from "@/components/registrar-actions";

export const registrationWithReferral = {
  action: {
    id: "176209761600000000111551110000000009545322000000000000006750000000000000067",
    type: "registration",
    incrementalDuration: 2419200,
    registrant: "0x877dd7fa7a6813361de23552c12d25af4a89cda7",
    registrationLifecycle: {
      subregistry: {
        subregistryId: {
          chainId: 11155111,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
      },
      node: "0x5bcdea30f2d591f5357045b89d3470d4ba4da00fd344a32fe323ab6fa2c0f343",
      expiresAt: 1764516816,
    },
    pricing: {
      baseCost: {
        currency: "ETH",
        amount: 7671232876711824n,
      },
      premium: {
        currency: "ETH",
        amount: 0n,
      },
      total: {
        currency: "ETH",
        amount: 7671232876711824n,
      },
    },
    referral: {
      encodedReferrer: "0x0000000000000000000000007bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
      decodedReferrer: "0x7bddd635be34bcf860d5f02ae53b16fcd17e8f6f",
    },
    block: {
      number: 9545322,
      timestamp: 1762097616,
    },
    transactionHash: "0x8b3316e97a92ea0f676943a206ef1722b90b279c0a769456a89b2afe37f205fa",
    eventIds: [
      "176209761600000000111551110000000009545322000000000000006750000000000000067",
      "176209761600000000111551110000000009545322000000000000006750000000000000071",
    ],
  },
  name: "nh35.eth" as InterpretedName,
} satisfies NamedRegistrarAction;

export const renewalWithNoReferral = {
  action: {
    id: "176304520800000000111551110000000009621987000000000000011350000000000000258",
    type: "renewal",
    incrementalDuration: 86400,
    registrant: "0xaea0579cdda2b0fe2a9799013569a042d481974f",
    registrationLifecycle: {
      subregistry: {
        subregistryId: {
          chainId: 11155111,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
      },
      node: "0xa44e5586236b99ea763394a6edbc5ae553a0fd62e138534a96313d4a18b8f28d",
      expiresAt: 1803205884,
    },
    pricing: {
      baseCost: { currency: "ETH", amount: 8732876712338n },
      premium: { currency: "ETH", amount: 0n },
      total: { currency: "ETH", amount: 8732876712338n },
    },
    referral: { encodedReferrer: null, decodedReferrer: null },
    block: { number: 9621987, timestamp: 1763045208 },
    transactionHash: "0x0915ea32f870485012d9b0b396612154b31df4493f17ca3d21f62f3358a22c9f",
    eventIds: [
      "176304520800000000111551110000000009621987000000000000011350000000000000258",
      "176304520800000000111551110000000009621987000000000000011350000000000000259",
    ],
  },
  name: "user1-extend.eth" as InterpretedName,
} satisfies NamedRegistrarAction;

export const registrationWithNoReferralAndEncodedLabelHashes = {
  action: {
    id: "176234701200000000111551110000000009566045000000000000014150000000000000198",
    type: "registration",
    incrementalDuration: 31536000,
    registrant: "0x5505957ff5927f29eacabbbe8a304968bf2dc064",
    registrationLifecycle: {
      subregistry: {
        subregistryId: {
          chainId: 11155111,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
      },
      node: "0xf1c0e6aa95596e0199f3a6341cdbe055b64ba6041662465e577ed80c4dfac2af",
      expiresAt: 1793883012,
    },
    pricing: {
      baseCost: null,
      premium: null,
      total: null,
    },
    referral: {
      encodedReferrer: null,
      decodedReferrer: null,
    },
    block: {
      number: 9566045,
      timestamp: 1762347012,
    },
    transactionHash: "0xa71cf08102ae1f634b22349dac8dc158fe96ae74008b5e24cfcda8587e056d53",
    eventIds: ["176234701200000000111551110000000009566045000000000000014150000000000000198"],
  },

  name: "[e4310bf4547cb18b16b5348881d24a66d61fa94a013e5636b730b86ee64a3923].eth" as InterpretedName,
} satisfies NamedRegistrarAction;

export const registrationWithZeroEncodedReferrer = {
  action: {
    id: "176304488400000000111551110000000009621960000000000000003350000000000000027",
    type: "registration",
    incrementalDuration: 31536000,
    registrant: "0xf7160904df99ccd003141105ecda8abd57af92fb",
    registrationLifecycle: {
      subregistry: {
        subregistryId: {
          chainId: 11155111,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
      },
      node: "0xdd274f7805db064520c39d0776602503c29720f88db0e9ca39b98196dcf4c337",
      expiresAt: 1794580884,
    },
    pricing: {
      baseCost: { currency: "ETH", amount: 3125000000003490n },
      premium: { currency: "ETH", amount: 0n },
      total: { currency: "ETH", amount: 3125000000003490n },
    },
    referral: {
      encodedReferrer: "0x0000000000000000000000000000000000000000000000000000000000000000",
      decodedReferrer: "0x0000000000000000000000000000000000000000",
    },
    block: { number: 9621960, timestamp: 1763044884 },
    transactionHash: "0x32391ebba1a90dc02920acafcbd0993aafcb8f0167a16a08efd6886f0e21e433",
    eventIds: [
      "176304488400000000111551110000000009621960000000000000003350000000000000027",
      "176304488400000000111551110000000009621960000000000000003350000000000000031",
    ],
  },
  name: "alix407.eth" as InterpretedName,
} satisfies NamedRegistrarAction;

export const registrationWithReferrerNotMatchingENSHolidayAwardsFormat = {
  action: {
    id: "176305292400000000111551110000000009622628000000000000002750000000000000049",
    type: "registration",
    incrementalDuration: 31536000,
    registrant: "0xf925f9aa4044fbdbaf427623b30240a88ce4f409",
    registrationLifecycle: {
      subregistry: {
        subregistryId: {
          chainId: 11155111,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
      },
      node: "0x9d5ea970c67219a0c594c0e95bbd51861c40d3383776edf17b7db4cbbd2ad6b9",
      expiresAt: 1794588924,
    },
    pricing: {
      baseCost: {
        currency: "ETH",
        amount: 3125000000003490n,
      },
      premium: {
        currency: "ETH",
        amount: 0n,
      },
      total: {
        currency: "ETH",
        amount: 3125000000003490n,
      },
    },
    referral: {
      encodedReferrer: "0x100000000000000000000000000000000000000000000000000000000000000",
      decodedReferrer: "0x0000000000000000000000000000000000000000",
    },
    block: {
      number: 9622628,
      timestamp: 1763052924,
    },
    transactionHash: "0xa93e18582be652506e24ff16c8cc2dca0377b907ca9aab9236d2eba0d3096cfb",
    eventIds: [
      "176305292400000000111551110000000009622628000000000000002750000000000000049",
      "176305292400000000111551110000000009622628000000000000002750000000000000053",
    ],
  },
  name: "sonu100.eth" as InterpretedName,
} satisfies NamedRegistrarAction;

function registrarActionWithUpdatedIncrementalDuration(
  registrarAction: NamedRegistrarAction,
  incrementalDuration: Duration,
): NamedRegistrarAction {
  return {
    ...registrarAction,
    action: { ...registrarAction.action, incrementalDuration },
    name: `incrementalDuration-${incrementalDuration}.${registrarAction.name}` as InterpretedName,
  } satisfies NamedRegistrarAction;
}

export const variants: Map<ResolutionStatusId, ResolvedRegistrarActions> = new Map([
  [
    ResolutionStatusIds.Initial,
    {
      resolutionStatus: ResolutionStatusIds.Initial,
    } satisfies RegistrarActionsInitial,
  ],
  [
    ResolutionStatusIds.UnsupportedConfig,
    {
      resolutionStatus: ResolutionStatusIds.UnsupportedConfig,
      requiredPlugins: [
        PluginName.Subgraph,
        PluginName.Basenames,
        PluginName.Lineanames,
        PluginName.Registrars,
      ],
    } satisfies RegistrarActionsUnsupportedConfig,
  ],
  [
    ResolutionStatusIds.IndexingStatusNotReady,
    {
      resolutionStatus: ResolutionStatusIds.IndexingStatusNotReady,
      supportedIndexingStatusIds: [
        OmnichainIndexingStatusIds.Completed,
        OmnichainIndexingStatusIds.Following,
      ],
    } satisfies RegistrarActionsIndexingStatusNotReady,
  ],
  [
    ResolutionStatusIds.Unresolved,
    {
      resolutionStatus: ResolutionStatusIds.Unresolved,
      placeholderCount: 8,
    } satisfies RegistrarActionsUnresolved,
  ],
  [
    ResolutionStatusIds.Unavailable,
    {
      resolutionStatus: ResolutionStatusIds.Unavailable,
      reason: "ENSNode connection error. Please check your selected connection.",
    } satisfies RegistrarActionsUnavailable,
  ],
  [
    ResolutionStatusIds.Available,
    {
      resolutionStatus: ResolutionStatusIds.Available,
      registrarActions: [
        renewalWithNoReferral,
        registrarActionWithUpdatedIncrementalDuration(renewalWithNoReferral, 0),
        registrarActionWithUpdatedIncrementalDuration(renewalWithNoReferral, 1),
        registrarActionWithUpdatedIncrementalDuration(renewalWithNoReferral, 2),
        registrationWithReferral,
        registrationWithNoReferralAndEncodedLabelHashes,
        registrationWithZeroEncodedReferrer,
        registrationWithReferrerNotMatchingENSHolidayAwardsFormat,
      ],
    } satisfies RegistrarActionsAvailable,
  ],
]);
