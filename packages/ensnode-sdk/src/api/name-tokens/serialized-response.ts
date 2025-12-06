import type { SerializedRegistrationLifecycle } from "../../registrars";
import type { SerializedNameToken } from "../../tokenscope";
import type {
  NameTokensResponse,
  NameTokensResponseError,
  NameTokensResponseOk,
  RegisteredNameToken,
} from "./response";

/**
 * Serialized representation of {@link NameTokensResponseError}.
 */
export type SerializedNameTokensResponseError = NameTokensResponseError;

/**
 * Serialized representation of {@link RegisteredNameToken}.
 */
export interface SerializedRegisteredNameToken
  extends Omit<RegisteredNameToken, "token" | "registrationLifecycle"> {
  token: SerializedNameToken;

  registrationLifecycle: SerializedRegistrationLifecycle;
}

/**
 * Serialized representation of {@link NameTokensResponseOk}.
 */
export interface SerializedNameTokensResponseOk extends Omit<NameTokensResponseOk, "nameTokens"> {
  nameTokens: SerializedRegisteredNameToken[];
}

/**
 * Serialized representation of {@link NameTokensResponse}.
 */
export type SerializedNameTokensResponse =
  | SerializedNameTokensResponseOk
  | SerializedNameTokensResponseError;
