import { serializeRegistrationLifecycle } from "../../registrars";
import { serializeNameToken } from "../../tokenscope";
import {
  type NameTokensResponse,
  NameTokensResponseCodes,
  type RegisteredNameToken,
} from "./response";
import type {
  SerializedNameTokensResponse,
  SerializedNameTokensResponseOk,
  SerializedRegisteredNameToken,
} from "./serialized-response";

export function serializeRegisteredNameToken({
  token,
  registrationLifecycle,
  tokenStatus,
}: RegisteredNameToken): SerializedRegisteredNameToken {
  return {
    token: serializeNameToken(token),
    registrationLifecycle: serializeRegistrationLifecycle(registrationLifecycle),
    tokenStatus,
  };
}

export function serializeNameTokensResponse(
  response: NameTokensResponse,
): SerializedNameTokensResponse {
  switch (response.responseCode) {
    case NameTokensResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        nameTokens: response.nameTokens.map(serializeRegisteredNameToken),
        accurateAsOf: response.accurateAsOf,
      } satisfies SerializedNameTokensResponseOk;

    case NameTokensResponseCodes.Error:
      return response;
  }
}
