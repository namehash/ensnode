import config from "@/config";

import {
  asInterpretedName,
  getParentInterpretedName,
  type Node,
  namehashInterpretedName,
} from "enssdk";

import {
  type NameTokensRequest,
  NameTokensResponseCodes,
  NameTokensResponseErrorCodes,
  type NameTokensResponseErrorIndexingStatusUnsupported,
  type NameTokensResponseErrorNameTokensNotIndexed,
  type NameTokensResponseOk,
  type PluginName,
  serializeNameTokensResponse,
} from "@ensnode/ensnode-sdk";

import { createApp } from "@/lib/hono-factory";
import { lazyProxy } from "@/lib/lazy";
import { findRegisteredNameTokensForDomain } from "@/lib/name-tokens/find-name-tokens-for-domain";
import { getIndexedSubregistries } from "@/lib/name-tokens/get-indexed-subregistries";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { nameTokensApiMiddleware } from "@/middleware/name-tokens.middleware";

import { getNameTokensRoute } from "./name-tokens-api.routes";

const app = createApp({ middlewares: [indexingStatusMiddleware, nameTokensApiMiddleware] });

// lazyProxy defers construction until first use so that this module can be
// imported without env vars being present (e.g. during OpenAPI generation).
const indexedSubregistries = lazyProxy(() =>
  getIndexedSubregistries(config.namespace, config.ensIndexerPublicConfig.plugins as PluginName[]),
);

/**
 * Factory function for creating a 404 Name Tokens Not Indexed error response
 */
const makeNameTokensNotIndexedResponse = (
  details: string,
): NameTokensResponseErrorNameTokensNotIndexed => ({
  responseCode: NameTokensResponseCodes.Error,
  errorCode: NameTokensResponseErrorCodes.NameTokensNotIndexed,
  error: {
    message: "No indexed Name Tokens found",
    details,
  },
});

app.openapi(getNameTokensRoute, async (c) => {
  // Check if Indexing Status resolution failed.
  if (c.var.indexingStatus instanceof Error) {
    return c.json(
      serializeNameTokensResponse({
        responseCode: NameTokensResponseCodes.Error,
        errorCode: NameTokensResponseErrorCodes.IndexingStatusUnsupported,
        error: {
          message: "Name Tokens API is not available yet",
          details:
            "Indexing status has not yet reached the required state to enable the Name Tokens API.",
        },
      } satisfies NameTokensResponseErrorIndexingStatusUnsupported),
      503,
    );
  }

  const request = c.req.valid("query") satisfies NameTokensRequest;
  let domainId: Node;

  if (request.name !== undefined) {
    const name = asInterpretedName(request.name);
    const parentName = getParentInterpretedName(name);

    // return 404 when the requested name was the ENS Root (which does not have a parent)
    if (parentName === null) {
      return c.json(
        serializeNameTokensResponse(
          makeNameTokensNotIndexedResponse(
            `The 'name' param must not be ENS Root, no tokens exist for it.`,
          ),
        ) satisfies NameTokensResponseErrorNameTokensNotIndexed,
        404,
      );
    }

    const parentNode = namehashInterpretedName(parentName);
    const subregistry = indexedSubregistries.find((s) => s.node === parentNode);

    // Return 404 response with error code for Name Tokens Not Indexed when
    // the parent name of the requested name does not match any of the
    // actively indexed subregistries.
    if (!subregistry) {
      return c.json(
        serializeNameTokensResponse(
          makeNameTokensNotIndexedResponse(
            `This ENSNode instance has not been configured to index tokens for the requested name: '${name}'`,
          ),
        ) satisfies NameTokensResponseErrorNameTokensNotIndexed,
        404,
      );
    }

    domainId = namehashInterpretedName(name);
  } else if (request.domainId !== undefined) {
    domainId = request.domainId;
  } else {
    // This should never happen due to Zod validation, but TypeScript needs this
    throw new Error("Invariant(name-tokens-api): Either name or domainId must be provided");
  }

  const { omnichainSnapshot } = c.var.indexingStatus.snapshot;
  const accurateAsOf = omnichainSnapshot.omnichainIndexingCursor;

  const registeredNameTokens = await findRegisteredNameTokensForDomain(domainId, accurateAsOf);

  // Return 404 response with error code for Name Tokens Not Indexed when
  // no name tokens were found for the domain ID associated with
  // the requested name.
  if (!registeredNameTokens) {
    const errorMessageSubject =
      request.name !== undefined ? `name: '${request.name}'` : `domain ID: '${request.domainId}'`;

    return c.json(
      serializeNameTokensResponse(
        makeNameTokensNotIndexedResponse(
          `No Name Tokens were indexed by this ENSNode instance for the requested ${errorMessageSubject}.`,
        ),
      ) satisfies NameTokensResponseErrorNameTokensNotIndexed,
      404,
    );
  }

  return c.json(
    serializeNameTokensResponse({
      responseCode: NameTokensResponseCodes.Ok,
      registeredNameTokens,
    } satisfies NameTokensResponseOk),
    200,
  );
});

export default app;
