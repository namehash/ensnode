// https://github.com/drizzle-team/drizzle-orm/issues/638
export function monkeypatchCollate(col: any, collation: string) {
  col.getSQLType = function (this: any) {
    return Object.getPrototypeOf(this).getSQLType.call(this) + " COLLATE " + collation;
  };
  return col;
}
