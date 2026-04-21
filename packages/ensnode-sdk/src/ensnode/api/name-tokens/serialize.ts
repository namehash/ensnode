import { serializeNameToken } from "../../../tokenscope/name-token";
import {
  type NameTokensResponse,
  NameTokensResponseCodes,
  type NameTokensResponseError,
  type NameTokensResponseOk,
  type RegisteredNameTokens,
} from "./response";
import type {
  SerializedNameTokensResponse,
  SerializedNameTokensResponseOk,
  SerializedRegisteredNameTokens,
} from "./serialized-response";

export function serializeRegisteredNameTokens({
  domainId,
  name,
  tokens,
  expiresAt,
  accurateAsOf,
}: RegisteredNameTokens): SerializedRegisteredNameTokens {
  return {
    domainId,
    name,
    tokens: tokens.map(serializeNameToken),
    expiresAt,
    accurateAsOf,
  };
}

export function serializeNameTokensResponse(
  response: NameTokensResponseOk,
): SerializedNameTokensResponseOk;
export function serializeNameTokensResponse<T extends NameTokensResponseError>(response: T): T;
export function serializeNameTokensResponse(
  response: NameTokensResponse,
): SerializedNameTokensResponse {
  switch (response.responseCode) {
    case NameTokensResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registeredNameTokens: serializeRegisteredNameTokens(response.registeredNameTokens),
      } satisfies SerializedNameTokensResponseOk;

    case NameTokensResponseCodes.Error:
      return response;
  }
}
