import superjson from "superjson";

/**
 * It's considered good practice to provide cursors as opaque strings exclusively useful for
 * paginating sets, so we encode/decode values using base64'd superjson.
 *
 * superjson handles BigInt and other non-JSON-native types transparently.
 */
export const cursors = {
  encode: <T>(value: T) => Buffer.from(superjson.stringify(value), "utf8").toString("base64"),
  decode: <T>(cursor: string): T => {
    try {
      return superjson.parse<T>(Buffer.from(cursor, "base64").toString("utf8"));
    } catch {
      throw new Error(
        "Invalid cursor: failed to decode cursor. The cursor may be malformed or from an incompatible query.",
      );
    }
  },
};
