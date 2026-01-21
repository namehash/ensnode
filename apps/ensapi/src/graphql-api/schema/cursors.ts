/**
 * It's considered good practice to provide cursors as opaque strings exclusively useful for
 * paginating sets, so we encode/decode entity ids using base64.
 */
export const cursors = {
  encode: (id: string) => Buffer.from(id, "utf8").toString("base64"),
  decode: <T extends string>(cursor: string) => Buffer.from(cursor, "base64").toString("utf8") as T,
};
