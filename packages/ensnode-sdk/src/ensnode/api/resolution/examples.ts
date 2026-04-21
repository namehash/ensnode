import type { ResolverRecordsSelection } from "../../../resolution";
import type {
  ResolvePrimaryNameResponse,
  ResolvePrimaryNamesResponse,
  ResolveRecordsResponse,
} from "./types";

/**
 * Example values for {@link ResolveRecordsResponse}, for use in OpenAPI documentation.
 */
export const resolveRecordsResponseExample = {
  records: {
    addresses: { "60": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" },
    texts: {
      description: "mi pinxe lo crino tcati",
    },
  },
  accelerationRequested: false,
  accelerationAttempted: false,
} satisfies ResolveRecordsResponse<ResolverRecordsSelection>;

/**
 * Example values for {@link ResolvePrimaryNameResponse}, for use in OpenAPI documentation.
 */
export const resolvePrimaryNameResponseExample = {
  name: "jesse.base.eth",
  accelerationRequested: false,
  accelerationAttempted: false,
} satisfies ResolvePrimaryNameResponse;

/**
 * Example values for {@link ResolvePrimaryNamesResponse}, for use in OpenAPI documentation.
 */
export const resolvePrimaryNamesResponseExample = {
  names: {
    "1": "jesse.base.eth",
    "10": null,
    "8453": "jesse.base.eth",
    "42161": null,
    "59144": null,
    "534352": null,
  },
  accelerationRequested: false,
  accelerationAttempted: false,
} satisfies ResolvePrimaryNamesResponse;
