import { graphql, useOmnigraphQuery } from "enskit/react/omnigraph";

const RootRegistryQuery = graphql(`
  query RootRegistry {
    root {
      id
      contract { chainId address }
    }
  }
`);

const RegistryByIdQuery = graphql(`
  query RegistryById($id: RegistryId!) {
    registry(by: { id: $id }) { id }
  }
`);

const RegistryByContractQuery = graphql(`
  query RegistryByContract($contract: AccountIdInput!) {
    registry(by: { contract: $contract }) { id }
  }
`);

function CacheStatus({ fetching, stale }: { fetching: boolean; stale: boolean }) {
  if (fetching) return <span style={{ color: "orange" }}>[fetching]</span>;
  if (stale) return <span style={{ color: "gray" }}>[stale]</span>;
  return <span style={{ color: "green" }}>[cache hit]</span>;
}

export function RegistryView() {
  const [rootResult] = useOmnigraphQuery({
    query: RootRegistryQuery,
    // context: { requestPolicy: "network-only" },
  });

  const root = rootResult.data?.root;

  const [byIdResult] = useOmnigraphQuery({
    query: RegistryByIdQuery,
    variables: root ? { id: root.id } : undefined,
    pause: !root,
  });

  const [byContractResult] = useOmnigraphQuery({
    query: RegistryByContractQuery,
    variables: root ? { contract: root.contract } : undefined,
    pause: !root,
  });

  if (rootResult.fetching) return <p>Loading root registry...</p>;
  if (rootResult.error) return <p>Error: {rootResult.error.message}</p>;
  if (!root) return <p>No ENSv2 root registry found for this namespace.</p>;

  return (
    <div>
      <h2>Registry Cache Demo</h2>

      <p>
        Demonstrates the loading of the same Registry (the ENSv2 Root Registry) in three different
        ways. After the first is populated in the cache, the others load instantly from the cache,
        without a subsequent network request.
      </p>

      <section>
        <h3>1. Query.root (network-only)</h3>
        <pre>
          id: {root.id}
          {"\n"}contract: {root.contract.chainId}:{root.contract.address}
        </pre>
      </section>

      <section>
        <h3>
          2. registry(by: {"{ id }"}){" "}
          <CacheStatus fetching={byIdResult.fetching} stale={byIdResult.stale} />
        </h3>
        <p>
          Same entity looked up by <code>id: "{root.id}"</code>
        </p>
        <pre>id: ${byIdResult.data?.registry?.id ?? "-"}</pre>
      </section>

      <section>
        <h3>
          3. registry(by: {"{ contract }"}){" "}
          <CacheStatus fetching={byContractResult.fetching} stale={byContractResult.stale} />
        </h3>
        <p>
          Same entity looked up by{" "}
          <code>
            contract: {root.contract.chainId}:{root.contract.address}
          </code>
        </p>
        <pre>
          <pre>id: ${byContractResult.data?.registry?.id ?? "-"}</pre>
        </pre>
      </section>
    </div>
  );
}
