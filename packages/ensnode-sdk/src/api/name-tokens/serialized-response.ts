import type { SerializedNameToken } from "../../tokenscope";
import type {
  NameTokensResponse,
  NameTokensResponseError,
  NameTokensResponseOk,
  RegisteredNameTokens,
} from "./response";

/**
 * Serialized representation of {@link NameTokensResponseError}.
 */
export type SerializedNameTokensResponseError = NameTokensResponseError;

/**
 * Serialized representation of {@link RegisteredNameToken}.
 */
export interface SerializedRegisteredNameTokens extends Omit<RegisteredNameTokens, "tokens"> {
  tokens: SerializedNameToken[];
}

/**
 * Serialized representation of {@link NameTokensResponseOk}.
 */
export interface SerializedNameTokensResponseOk
  extends Omit<NameTokensResponseOk, "registeredNameTokens"> {
  registeredNameTokens: SerializedRegisteredNameTokens;
}

/**
 * Serialized representation of {@link NameTokensResponse}.
 */
export type SerializedNameTokensResponse =
  | SerializedNameTokensResponseOk
  | SerializedNameTokensResponseError;
