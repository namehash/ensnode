{
  "Alpha Mainnet": {
    "versionInfo": {
      "ensApi": "0.35.0",
      "ensNormalize": "1.11.1"
    },
    "theGraphFallback": {
      "canFallback": false,
      "reason": "no-api-key"
    },
    "ensIndexerPublicConfig": {
      "labelSet": {
        "labelSetId": "subgraph",
        "labelSetVersion": 0
      },
      "indexedChainIds": [1, 8453, 59144, 10, 42161, 534352, 567],
      "ensIndexerSchemaName": "alphaSchema0.34.0",
      "ensRainbowPublicConfig": {
        "version": "0.34.0",
        "labelSet": {
          "labelSetId": "subgraph",
          "highestLabelSetVersion": 0
        },
        "recordsCount": 100
      },
      "isSubgraphCompatible": false,
      "namespace": "mainnet",
      "plugins": [
        "subgraph",
        "basenames",
        "lineanames",
        "threedns",
        "protocol-acceleration",
        "registrars",
        "tokenscope"
      ],
      "versionInfo": {
        "nodejs": "22.18.0",
        "ponder": "0.11.43",
        "ensDb": "0.35.0",
        "ensIndexer": "0.35.0",
        "ensNormalize": "1.11.1"
      }
    }
  },
  "Alpha Sepolia": {
    "versionInfo": {
      "ensApi": "0.35.0",
      "ensNormalize": "1.11.1"
    },
    "theGraphFallback": {
      "canFallback": true,
      "url": ""
    },
    "ensIndexerPublicConfig": {
      "labelSet": {
        "labelSetId": "subgraph",
        "labelSetVersion": 0
      },
      "versionInfo": {
        "nodejs": "22.18.0",
        "ponder": "0.11.43",
        "ensDb": "0.35.0",
        "ensIndexer": "0.35.0",
        "ensNormalize": "1.11.1"
      },
      "indexedChainIds": [11155111, 84532, 59141, 11155420, 421614, 534351],
      "namespace": "sepolia",
      "plugins": [
        "subgraph",
        "basenames",
        "lineanames",
        "threedns",
        "protocol-acceleration",
        "registrars"
      ],
      "ensIndexerSchemaName": "alphaSepoliaSchema0.34.0",
      "ensRainbowPublicConfig": {
        "version": "0.34.0",
        "labelSet": {
          "labelSetId": "subgraph",
          "highestLabelSetVersion": 0
        },
        "recordsCount": 100
      },
      "isSubgraphCompatible": false
    }
  },
  "Subgraph Mainnet": {
    "versionInfo": {
      "ensApi": "0.35.0",
      "ensNormalize": "1.11.1"
    },
    "theGraphFallback": {
      "canFallback": false,
      "reason": "no-api-key"
    },
    "ensIndexerPublicConfig": {
      "labelSet": {
        "labelSetId": "subgraph",
        "labelSetVersion": 0
      },
      "versionInfo": {
        "nodejs": "22.18.0",
        "ponder": "0.11.43",
        "ensDb": "0.35.0",
        "ensIndexer": "0.35.0",
        "ensNormalize": "1.11.1"
      },
      "indexedChainIds": [1],
      "namespace": "mainnet",
      "plugins": ["subgraph"],
      "ensIndexerSchemaName": "mainnetSchema0.34.0",
      "ensRainbowPublicConfig": {
        "version": "0.34.0",
        "labelSet": {
          "labelSetId": "subgraph",
          "highestLabelSetVersion": 0
        },
        "recordsCount": 100
      },
      "isSubgraphCompatible": true
    }
  },
  "Subgraph Sepolia": {
    "versionInfo": {
      "ensApi": "0.35.0",
      "ensNormalize": "1.11.1"
    },
    "theGraphFallback": {
      "canFallback": false,
      "reason": "no-api-key"
    },
    "ensIndexerPublicConfig": {
      "labelSet": {
        "labelSetId": "subgraph",
        "labelSetVersion": 0
      },
      "versionInfo": {
        "nodejs": "22.18.0",
        "ponder": "0.11.43",
        "ensDb": "0.35.0",
        "ensIndexer": "0.35.0",
        "ensNormalize": "1.11.1"
      },
      "indexedChainIds": [11155111],
      "namespace": "sepolia",
      "plugins": ["subgraph"],
      "ensIndexerSchemaName": "sepoliaSchema0.34.0",
      "ensRainbowPublicConfig": {
        "version": "0.34.0",
        "labelSet": {
          "labelSetId": "subgraph",
          "highestLabelSetVersion": 0
        },
        "recordsCount": 100
      },
      "isSubgraphCompatible": true
    }
  },
  "Serialization Error": {
    "versionInfo": {
      "ensApi": "0.35.0",
      "ensNormalize": "1.11.1"
    },
    "theGraphFallback": {
      "canFallback": false,
      "reason": "no-api-key"
    },
    "ensIndexerPublicConfig": {
      "labelSet": {
        "labelSetId": "",
        "labelSetVersion": 0
      },
      "versionInfo": {
        "nodejs": "",
        "ponder": "",
        "ensDb": "",
        "ensIndexer": "",
        "ensNormalize": ""
      },
      "indexedChainIds": [11155111],
      "namespace": "sepolia",
      "plugins": ["subgraph"],
      "ensIndexerSchemaName": "DeserializationSchema0.34.0",
      "ensRainbowPublicConfig": {
        "version": "",
        "labelSet": {
          "labelSetId": "",
          "highestLabelSetVersion": -1
        },
        "recordsCount": -1
      },
      "isSubgraphCompatible": true
    }
  }
}
