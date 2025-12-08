import { serializeNameToken } from "../../tokenscope";
import {
  type NameTokensResponse,
  NameTokensResponseCodes,
  type RegisteredNameTokens,
} from "./response";
import type {
  SerializedNameTokensResponse,
  SerializedNameTokensResponseOk,
  SerializedRegisteredNameTokens,
} from "./serialized-response";

export function serializeRegisteredNameTokens({
  domainId,
  expiresAt,
  tokens,
}: RegisteredNameTokens): SerializedRegisteredNameTokens {
  return {
    domainId,
    expiresAt,
    tokens: tokens.map(serializeNameToken),
  };
}

export function serializeNameTokensResponse(
  response: NameTokensResponse,
): SerializedNameTokensResponse {
  switch (response.responseCode) {
    case NameTokensResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registeredNameTokens: serializeRegisteredNameTokens(response.registeredNameTokens),
        accurateAsOf: response.accurateAsOf,
      } satisfies SerializedNameTokensResponseOk;

    case NameTokensResponseCodes.Error:
      return response;
  }
}
