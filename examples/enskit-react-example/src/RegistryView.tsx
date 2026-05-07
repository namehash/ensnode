import { graphql, type UseOmnigraphQueryResult, useOmnigraphQuery } from "enskit/react/omnigraph";
import { useMemo } from "react";

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

function CacheStatus({ result }: { result: UseOmnigraphQueryResult[0] }) {
  const cacheOutcome = result.operation?.context.meta?.cacheOutcome;
  if (cacheOutcome === "hit") return <span style={{ color: "green" }}>[hit]</span>;
  if (cacheOutcome === "partial") return <span style={{ color: "orange" }}>[partial]</span>;
  return <span style={{ color: "orange" }}>[uncached]</span>;
}

export function RegistryView() {
  const [rootResult, reloadRoot] = useOmnigraphQuery({
    query: RootRegistryQuery,
    // NOTE: urql `context` args _must_ be memoized to avoid infinite re-renders
    context: useMemo(() => ({ requestPolicy: "network-only" }), []),
  });

  const root = rootResult.data?.root;

  const [byIdResult, reloadById] = useOmnigraphQuery({
    query: RegistryByIdQuery,
    variables: root ? { id: root.id } : undefined,
    pause: !root,
  });

  const [byContractResult, reloadByContract] = useOmnigraphQuery({
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
        <h3>
          1. Query.root (network-only) — <CacheStatus result={rootResult} />
        </h3>
        <pre>
          id: {root.id}
          {"\n"}contract: {root.contract.chainId}:{root.contract.address}
        </pre>
        <button type="button" onClick={() => reloadRoot()}>
          Refresh
        </button>
      </section>

      <section>
        <h3>
          2. registry(by: {"{ id }"}) — <CacheStatus result={byIdResult} />
        </h3>
        <p>
          Same entity looked up by <code>id: "{root.id}"</code>
        </p>
        <pre>id: {byIdResult.data?.registry?.id ?? "-"}</pre>
        <button type="button" onClick={() => reloadById()}>
          Refresh
        </button>
      </section>

      <section>
        <h3>
          3. registry(by: {"{ contract }"}) — <CacheStatus result={byContractResult} />
        </h3>
        <p>
          Same entity looked up by{" "}
          <code>
            contract: {root.contract.chainId}:{root.contract.address}
          </code>
        </p>
        <pre>id: {byContractResult.data?.registry?.id ?? "-"}</pre>
        <button type="button" onClick={() => reloadByContract()}>
          Refresh
        </button>
      </section>
    </div>
  );
}
