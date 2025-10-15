import { publicClients } from "ponder:api";
import {
  IndexingStatusResponseCodes,
  IndexingStatusResponseError,
  IndexingStatusResponseOk,
  OmnichainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  deserializeChainId,
  deserializeUrl,
  serializeENSIndexerPublicConfig,
  serializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";
import { otel } from "@hono/otel";
import { Hono } from "hono";

import {
  buildOmnichainIndexingStatusSnapshot,
  createCrossChainIndexingStatusSnapshotOmnichain,
} from "@/api/lib/indexing-status";
import config from "@/config";
import { buildENSIndexerPublicConfig } from "@/config/public";
import { getUnixTime } from "date-fns";
import { getAddress } from "viem";
import resolutionApi from "./resolution-api";

const app = new Hono();

// include automatic OpenTelemetry instrumentation for incoming requests
app.use("*", otel());

// include ENSIndexer Public Config endpoint
app.get("/config", async (c) => {
  // prepare the public config object, including dependency info
  const publicConfig = await buildENSIndexerPublicConfig(config);

  // respond with the serialized public config object
  return c.json(serializeENSIndexerPublicConfig(publicConfig));
});

app.get("/indexing-status", async (c) => {
  // get system timestamp for the current request
  const snapshotTime = getUnixTime(new Date());

  let omnichainSnapshot: OmnichainIndexingStatusSnapshot | undefined;

  try {
    omnichainSnapshot = await buildOmnichainIndexingStatusSnapshot(publicClients);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Omnichain snapshot is currently not available: ${errorMessage}`);
  }

  // return IndexingStatusResponseError
  if (typeof omnichainSnapshot === "undefined") {
    return c.json(
      serializeIndexingStatusResponse({
        responseCode: IndexingStatusResponseCodes.Error,
      } satisfies IndexingStatusResponseError),
      500,
    );
  }

  // otherwise, proceed with creating IndexingStatusResponseOk
  const crossChainSnapshot = createCrossChainIndexingStatusSnapshotOmnichain(
    omnichainSnapshot,
    snapshotTime,
  );

  const projectedAt = getUnixTime(new Date());
  const realtimeProjection = createRealtimeIndexingStatusProjection(
    crossChainSnapshot,
    projectedAt,
  );

  // return the serialized indexing status response object
  return c.json(
    serializeIndexingStatusResponse({
      responseCode: IndexingStatusResponseCodes.Ok,
      realtimeProjection,
    } satisfies IndexingStatusResponseOk),
  );
});

// Resolution API
app.route("/resolve", resolutionApi);

/**
 * > AssetId.parse("eip155:1/erc721:0x60e4d786628fea6478f785a6d7e704777c86a7c6/6007")
{
  chainId: { namespace: 'eip155', reference: '1' },
  assetName: {
    namespace: 'erc721',
    reference: '0x60e4d786628fea6478f785a6d7e704777c86a7c6'
  },
  tokenId: '6007'
}
 */

const tokenUriAbi = {
  erc721: [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "tokenId",
          type: "uint256",
        },
      ],
      name: "tokenURI",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
  erc1155: [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "id",
          type: "uint256",
        },
      ],
      name: "uri",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
} as const;

// NFT token image URL resolution
app.get("/nft/:chainId/:assetNamespace/:contractAddress/:tokenId", async (c) => {
  // TODO: validate input
  const chainId = deserializeChainId(c.req.param("chainId"));
  const assetNamespace = c.req.param("assetNamespace");
  const contractAddress = getAddress(c.req.param("contractAddress"));
  const tokenId = BigInt(c.req.param("tokenId"));

  const publicClient = Object.values(publicClients).find(
    (publicClient) => publicClient.chain?.id === chainId,
  );

  // Invariant: publicClient for chainId is available
  if (!publicClient) {
    throw new Error(`No public client found for '${chainId}' chainId`);
  }

  // Invariant: tokenUriAbi exists for selected asset namespace
  if (assetNamespace !== "erc721" && assetNamespace !== "erc1155") {
    throw new Error(`No Token URI ABI found for '${assetNamespace}' asset namespace`);
  }

  let tokenUri: string;

  switch (assetNamespace) {
    case "erc721":
      {
        tokenUri = await publicClient.readContract({
          address: contractAddress,
          functionName: "tokenURI",
          args: [tokenId],
          abi: tokenUriAbi.erc721,
        });
      }
      break;
    case "erc1155":
      {
        tokenUri = await publicClient.readContract({
          address: contractAddress,
          functionName: "uri",
          args: [tokenId],
          abi: tokenUriAbi.erc1155,
        });
      }
      break;
  }

  try {
    // validate all network values
    const tokenURL = deserializeUrl(tokenUri);

    const tokenMetadataJson = await fetch(tokenURL).then((r) => r.json());

    const tokenImageUrl = new URL(tokenMetadataJson.image);

    return c.json({
      chainId,
      contractAddress,
      tokenId: tokenId.toString(),
      tokenImageUrl: tokenImageUrl.toString(),
    });
  } catch (error) {
    console.error(error);
    throw new Error("Could not handle the request");
  }
});

export default app;
