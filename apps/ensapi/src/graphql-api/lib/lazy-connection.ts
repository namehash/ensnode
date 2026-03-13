/**
 * Wraps a connection with lazy field resolution via getters. Each getter returns a Promise
 * that is only created when the field is selected in the GraphQL query. The connection
 * callback is memoized so `edges` and `pageInfo` share a single underlying query.
 */
export const lazyConnection = <Edges, PageInfo>({
  connection,
  totalCount,
}: {
  connection: () => Promise<{ edges: Edges; pageInfo: PageInfo }>;
  totalCount: () => Promise<number>;
}) => {
  let _conn: ReturnType<typeof connection> | null = null;
  const memoizedConnection = () => {
    if (_conn === null) _conn = connection();
    return _conn;
  };

  return {
    get edges() {
      return memoizedConnection().then((c) => c.edges);
    },
    get pageInfo() {
      return memoizedConnection().then((c) => c.pageInfo);
    },
    get totalCount() {
      return totalCount();
    },
  };
};
