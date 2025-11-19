export const cursors = {
  encode: (id: string) => Buffer.from(id, "utf8").toString("base64"),
  decode: <T extends string>(cursor: string) => Buffer.from(cursor, "base64").toString("utf8") as T,
};
